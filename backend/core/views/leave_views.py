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

class LeaveRequestViewSet(APIView):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        try:
            is_company = Company.objects.filter(email=request.user.email).exists()
            if(is_company):
                try:
                    leave_requests = LeaveRequest.objects.filter(hr_reviewed=True).select_related('employee').annotate(
                    username=Concat(
                            F('employee__first_name'),
                            Value(' '),
                            F('employee__last_name'),
                            output_field=CharField()
                        )
                    ).values(
                        'username',
                        'id',
                        'to_date',
                        'from_date',
                        'reason',
                        'status',
                        'applied_at',
                        'leave_type'
                    ).order_by('-id') 
                
                    # print('leave_requests:', leave_requests)
                    return Response({'data' : leave_requests}, status=status.HTTP_200_OK)
                except Exception as e:
                    return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

            employee = Employee.objects.get(company_email=request.user.email)
            leave_details = LeaveRequest.objects.filter(employee=employee)
            serializer = LeaveRequestSerializer(leave_details, many=True)
            print('serializer:', serializer)
            return Response({'data' : {'data' : serializer.data}}, status=status.HTTP_200_OK)
            

        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)


    def post(self, request, *args, **kwargs):
        try:
            data = request.data.copy()
            user = request.user
            print('user:', user)
            employee = Employee.objects.get(first_name=user)
            data['employee'] = employee.id 

            # Handle 'Single day' case
            if data.get('duration') == 'Single day':
                data['to_date'] = data.get('from_date')

            # If to_date is empty, remove it
            if not data.get('to_date'):
                data.pop('to_date', None)

            # Now serialize the data
            serializer = LeaveRequestSerializer(data=data)
            print('serializer ===<<<>>', serializer)
            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Leave request created successfully.'}, status=status.HTTP_201_CREATED)
            else:
                print('serializer errors:', serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        

    def put(self, request, pk, *args, **kwargs):
        try:
            print('pk update ==<<>>>:', pk)
            print('request.data:', request.data)
            leave_request = LeaveRequest.objects.get(pk=pk)
            print('leave_request:', leave_request)
            # Update the leave request with the provided data
            serializer = LeaveRequestSerializer(leave_request, data=request.data, partial=True)
            print('serializer:', serializer)

            if serializer.is_valid():
                serializer.save()
                return Response({'success': 'Leave request updated successfully.'}, status=status.HTTP_200_OK)
            else:
                print("Serializer errors:", serializer.errors)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except LeaveRequest.DoesNotExist:
            return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            print("Error during update:", str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


