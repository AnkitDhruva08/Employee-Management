from core.models import LeaveRequest, LeaveBalance, Employee, Company
from core.serializers import LeaveRequestSerializer
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
from core.utils.leave_utils import get_leave_requests
from core.utils.utils import is_profile_complete
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from core.async_task.tasks import send_email_task

User = get_user_model()  

class LeaveRequestViewSet(APIView):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
        
    def get(self, request):
        try:
            email = request.user.email
            is_company = Company.objects.filter(email=email).exists()
            role_id = None
            emp_id = None
            company_id = None
            if not is_company:
                try:
                    employee = Employee.objects.get(company_email=email)
                    role_id = employee.role_id
                    emp_id = employee.id
                    company_id = employee.company_id
                except Employee.DoesNotExist:
                    return Response({'error': 'Employee not found'}, status=404)
                
            if(is_company):
                company_data = Company.objects.get(email = request.user.email)
                company_id = company_data.id


            data = get_leave_requests(is_company, role_id, emp_id, company_id)
            if data.get('success') is False:
                return Response({
                    "is_complete": data.get('is_complete', False),
                    "message": data.get('message', 'Profile incomplete.'),
                    "missing_sections": data.get('missing_sections', None),
                    "data": None
                }, status=200)

            return Response(data, status=200)

        except Exception as e:
            return Response({'error': str(e)}, status=500)


    def post(self, request, *args, **kwargs):
        try:
            employee = Employee.objects.get(company_email=request.user.email)
            company_id = employee.company_id
            request.data._mutable = True

            # Enrich request data
            request.data['employee'] = employee.id
            request.data['company_id'] = employee.company_id
            request.data['active'] = True

            # HR auto-approval
            if employee.role_id == 2:
                request.data['hr_reviewed'] = True
                request.data['status'] = 'HR Approved'

            # Handle single day leave
            if request.data.get('duration', '').lower() == 'single day':
                request.data['to_date'] = request.data.get('from_date')

            # Clean to_date if not set
            if not request.data.get('to_date'):
                request.data.pop('to_date', None)

            # Handle file upload
            if 'attachment' in request.FILES:
                request.data['leave_document'] = request.FILES['attachment']

            serializer = LeaveRequestSerializer(data=request.data)

            # --- Send Email Notification ---
            company = Company.objects.get(id=company_id, active=True)
            super_user = User.objects.get(is_superuser=True)

            employee_name = f"{employee.first_name} {employee.last_name}"
            leave_type = request.data.get("leave_type", "N/A")
            from_date = request.data.get("from_date", "N/A")
            to_date = request.data.get("to_date", "N/A")
            reason = request.data.get("reason", "N/A")
            submitted_on = timezone.now().strftime("%B %d, %Y %I:%M %p")

            recipients = [super_user.email]

            # Add HR (if not already the employee)
            role_id = employee.role_id
            hr_user = Employee.objects.filter(role_id=2, company_id=company_id).first()
            if hr_user and hr_user.company_email not in recipients and hr_user.company_email != employee.company_email:
                recipients.append(hr_user.company_email)

            # Add Admin
            admin_user = Employee.objects.filter(role_id=1, company_id=company_id).first()
            if admin_user and admin_user.company_email not in recipients:
                recipients.append(admin_user.company_email)
           
            # If company
            company_user = User.objects.filter(is_company=True, id=company_id).first()
            if company_user and company_user.email not in recipients:
                recipients.append(company_user.email)

            subject = f"📩 Leave Request Submitted by {employee_name}"

            message = (
                f"Hello Team,\n\n"
                f"A new leave request has been submitted in the Employee Management System.\n\n"
                f"👤 Employee: {employee_name}\n"
                f"🏢 Company: {company.company_name}\n"
                f"📧 Email: {employee.company_email}\n"
                f"🗓️ Leave Type: {leave_type}\n"
                f"📅 From: {from_date}\n"
                f"📅 To: {to_date}\n"
                f"📝 Reason: {reason}\n"
                f"🕒 Submitted On: {submitted_on}\n\n"
                f"📌 Current Status: {'HR Approved' if employee.role_id == 2 else 'Pending Review'}\n\n"
                f"➡️ Please log in to the system to review and take appropriate action:\n"
                f"🔗 http://localhost:5173/login\n\n"
                f"Thank you,\n"
                f"Employee Management System\n"
                f"Support Team"
            )
            # recipients use when send actuall one
            send_email_task.delay(subject, message, recipients)

            # --- Save the request ---
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Leave request created successfully.'}, status=status.HTTP_201_CREATED)
            else:
                print("Serializer errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("Leave request error:", str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)



    def put(self, request, pk, *args, **kwargs):
        try:
            leave_request = LeaveRequest.objects.get(pk=pk)
            data = request.data.copy()
            print('data ===>>>', data)
            leave_status = request.data.get('status')
            leave_comments = request.data.get('comment')

            # Get current user
            user_data = User.objects.get(email=request.user.email)
            company_id = None
            recipients = []

            # Superuser email
            try:
                super_user = User.objects.get(is_superuser=True)
                recipients.append(super_user.email)
            except User.DoesNotExist:
                pass  # Optional: Log or handle missing superuser

            # Determine company ID and add HR/Admin emails
            if user_data.is_company:
                company_data = Company.objects.get(user_id=user_data)
                company_id = company_data.id

            elif user_data.is_employee:
                employee_data = Employee.objects.get(user_id=user_data.id)
                company_id = employee_data.company_id

                # Add Admin & HR (only if not the same user)
                admin_user = Employee.objects.filter(company_id=company_id, role_id=1, active=True).exclude(id=employee_data.id).first()
                hr_user = Employee.objects.filter(company_id=company_id, role_id=2, active=True).exclude(id=employee_data.id).first()

                if admin_user:
                    recipients.append(admin_user.company_email)
                if hr_user:
                    recipients.append(hr_user.company_email)

            # Set review flags based on status
            status_val = data.get('status')
            if status_val == 'HR Approved':
                data['hr_reviewed'] = True
            if status_val == 'Admin Approved':
                data['admin_reviewed'] = True
                data['hr_reviewed'] = True

            # Get leave and employee data
            leave_data = LeaveRequest.objects.get(id=pk)
            leave_applicant = Employee.objects.get(id=leave_data.employee_id)
            recipients.append(leave_applicant.company_email)

            # Get company info
            company_user = Company.objects.get(id=company_id)

            # Update the leave request
            serializer = LeaveRequestSerializer(leave_request, data=data, partial=True)
            if serializer.is_valid():
                serializer.save()

                # Get full name of the employee
                employee_name = f"{leave_applicant.first_name} {leave_applicant.last_name}"
                leave_status = data.get("status", "Updated")
                leave_comments = data.get("comments", "").strip()

                # Format the subject
                subject = f"📢 Leave Request {leave_status} Notification"

                # Format the message body
                message = (
                    f"Dear {employee_name},\n\n"
                    f"This is to inform you that the status of your leave request has been updated in the Employee Management System.\n\n"
                    f"📝 **Leave Details**:\n"
                    f"• Type: {leave_data.leave_type}\n"
                    f"• From: {leave_data.from_date}\n"
                    f"• To: {leave_data.to_date}\n"
                    f"• Reason: {leave_data.reason}\n"
                )

                # Add comments if available
                if leave_comments:
                    message += f"• Reviewer Comments: {leave_comments}\n"

                # Add status and login info
                message += (
                    f"\n📌 **Updated Status**: {leave_status}\n\n"
                    f"You can log in to your account for more details or to take further action:\n"
                    f"🔗 http://localhost:5173/login\n\n"
                    f"Best regards,\n"
                    f"{company_user.company_name} HR Team\n"
                    f"Employee Management System"
                )

                # Send to the specific employee only
                send_email_task.delay(subject, message, [leave_applicant.company_email])

                return Response({'success': 'Leave request updated successfully.'}, status=status.HTTP_200_OK)
            else:
                print("Serializer errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except LeaveRequest.DoesNotExist:
            return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            print("Error during update:", str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


        

