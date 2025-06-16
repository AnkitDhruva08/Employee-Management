from itertools import count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import permission_classes, api_view
from core.serializers import CompanySerializer, UserSerializer
from core.models import Company, Employee, Notification
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from datetime import datetime
from core.models import Attendance
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.core.mail import send_mail
from django.conf import settings
import traceback
from django.utils.timezone import now
# User Model
User = get_user_model() 

#  Company Registration Views 
class CompanyRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            # Convert QueryDict to dict for safe manipulation
            company_data = request.data.dict()
            email = company_data.pop('email', None)
            default_password = company_data.pop('password', None)
            company_name = company_data.get('company_name')
            contact_number = company_data.get('contact_number')


            if not email or not default_password:
                return Response({
                    "email": "Email is required." if not email else "",
                    "password": "Password is required." if not default_password else ""
                }, status=status.HTTP_400_BAD_REQUEST)

            # Check if email already exists in User model
            if User.objects.filter(email=email).exists():
                return Response(
                    {"error": "A company with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
            print('contact_number ==<>>', contact_number)
            if Company.objects.filter(contact_number=contact_number).exists():
                return Response({'error': 'Company with this contact number already exists.'}, status=400) 

            # Create User
            user = User.objects.create(
                username=company_name,
                email=email,
                password=make_password(default_password),
                is_company=True
            )

            # Filter company fields to match model fields
            allowed_fields = [
                'company_name', 'team_size', 'street_address', 'city',
                'state_province', 'zip_code', 'country', 'contact_number'
            ]
            company_fields = {k: v for k, v in company_data.items() if k in allowed_fields}

            # Add email explicitly for Company model
            company_fields['email'] = email

            # Handle file upload for company_logo
            profile_image = request.FILES.get('company_logo')
            if profile_image:
                company_fields['profile_image'] = profile_image

            # Create Company and link to User
            company = Company.objects.create(
                user=user,
                created_by=user,
                updated_by=user,
                **company_fields
            )

            # Notify superuser
            try:
                super_user = User.objects.get(is_superuser=True)
                Notification.objects.create(
                    user=super_user,
                    message=f"Company '{company_name}' has been registered successfully.",
                    notification_type="company",
                    url=f"/companies/{company.id}/"
                )
                super_user_email = super_user.email
            except User.DoesNotExist:
                print("Superuser not found.")
                super_user_email = None

            # Send welcome email to superuser
            if super_user_email:
                subject = f"🚀 Welcome to {company_name}'s Employee Management System - Superuser Access Granted!"
                message = (
                    f"Dear {company_name} Leader,\n\n"
                    f"🎉 Congratulations! New organization has officially joined the {company_name} Employee Management System.\n\n"
                    f"🔐 Company Login Credentials:\n"
                    f"🌐 Access Portal: http://localhost:5173/login\n"
                    f"📧 Email: {email}\n"
                    f"🔑 Temporary Password: {default_password}\n\n"
                    f"🛡️ Please log in and update your password for security purposes.\n\n"
                    f"💡 What Can You Do as a Superuser?\n"
                    f"• Create and manage company profiles\n\n"
                    f"If you require any assistance, feel free to contact our support team.\n\n"
                    f"With gratitude,\n"
                    f"💼 {company_name} Support Team\n"
                    f"🌟 Empowering Your Company’s Success"
                )
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [super_user_email])

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Serialize and return response
            serializer = CompanySerializer(company)

            return Response({
                'message': 'Registered Successfully',
                'status': 201,
                'data': serializer.data,
                'is_company': True,
                'tokens': {
                    'access': access_token,
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("Exception Traceback:\n", traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)



#  Login views Based on role and also for organization

class LoginLogoutView(APIView):
    """
    Handles login (POST) and logout (DELETE), and tracks attendance.
    """

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        company_id = None

        if not email or not password:
            return Response({"error": "Email and password required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            print('')
            is_active = user.is_active
            print('is_active ==<<>>', is_active)
            if not user.is_active:
                return Response({"error": "This account has been deleted"}, status=status.HTTP_403_FORBIDDEN)

        except User.DoesNotExist:
            return Response({"error": "Invalid email or user does not exist"}, status=status.HTTP_404_NOT_FOUND)


        # Authenticate using email
        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

        # Login and generate JWT
        login(request, user)
        refresh = RefreshToken.for_user(user)

        # Track attendance
        today = now().date()
        print('user ==<<>>', user)

        user_data = User.objects.get(email= email)
        if user.is_company:
            try:
                company = Company.objects.get(user_id=user.id, active=True)
                company_id = company.id
            except Company.DoesNotExist:
                return Response({'error': 'Company not found or inactive.'}, status=404)

        elif user.is_employee:
            try:
                employee = Employee.objects.get(user_id=user.id, active=True)
                company_id = employee.company_id
            except Employee.DoesNotExist:
                return Response({'error': 'Employee not found or inactive.'}, status=404)

        if not company_id:
            return Response({'error': 'Could not determine company.'}, status=400)

        # Create or get attendance
        attendance, created = Attendance.objects.get_or_create(
            user=user,
            company_id=company_id,
            date=today
        )

        if (not attendance.check_in):
            print('attendance ==<<>>', attendance)
            attendance.check_in = now()
            attendance.save()


        # Fetch role and flags
        role_data = Employee.objects.filter(company_email=email).values('role_id').first()
        role_id = role_data['role_id'] if role_data else None
        is_company = user.is_company
        is_superuser = user.is_superuser

        return Response({
            "message": "Login successful!",
            "status": 200,
            "role_id": role_id,
            "is_company": is_company,
            "is_superuser": is_superuser,
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            },
            "session": "User session created successfully"
        }, status=status.HTTP_200_OK)


    def delete(self, request):
        user = request.user if request.user.is_authenticated else None
        
        if not user:
            return Response({"error": "User  not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

        today = now().date()  # Use timezone-aware datetime
        try:
            # Fetch the attendance record for the current user and today's date
            attendance = Attendance.objects.get(user=user, date=today)

            # Update the checkout time
            attendance.check_out = now()  # Use timezone-aware datetime
            attendance.save()

        except Attendance.DoesNotExist:
            print("No attendance record found for today.")
            # Optionally, you can return a message indicating that no record was found
            return Response({"message": "No attendance record found for today."}, status=status.HTTP_404_NOT_FOUND)

        # Log the user out
        logout(request)
        return Response({"message": "Logout successful!"}, status=status.HTTP_200_OK)
