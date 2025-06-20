from rest_framework import viewsets
from core.models import Event, Holiday, Company, Employee
from core.serializers import EventSerializer, HolidaySerializer
from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.db.models import F, Value, CharField
from django.db.models.functions import Concat
from django.utils import timezone
from django.conf import settings
from core.async_task.tasks import send_email_task

User = get_user_model()  




class EventViewSet(APIView):
    permission_classes = [IsAuthenticated]


    def get(self, request, pk=None, *args, **kwargs):
        user_data = User.objects.get(email=request.user.email)
        print('user_data', user_data)
        
        company_id = None 
        if user_data.is_company:
            company_data = Company.objects.get(user_id=user_data.id)
            company_id = company_data.id
        elif user_data.is_employee:
            employee_data = Employee.objects.get(user_id=user_data.id)
            company_id = employee_data.company_id 

        event_data = Event.objects.filter(company_id=company_id, active=True)
        print('event_data =<<<>>', event_data)

        return Response(EventSerializer(event_data, many=True).data, status=200)

       
    def post(self, request, *kwargs, **args):
        try:
            print('data comming from frontned ==<<<>>', request.data)
            data = request.data.copy()
            user_data = User.objects.get(email=request.user.email)
            data_tobe_save = {}
            print('user_data', user_data)
            company_id = None 
            if user_data.is_company:
                company_data = Company.objects.get(user_id=user_data.id)
                company_id = company_data.id
            if user_data.is_employee:
                employee_data = Employee.objects.get(user_id= user_data.id)
                company_id = employee_data.company_id 

            
            data_tobe_save['company_id'] = company_id
            data_tobe_save['event'] = request.data.get('eventType')
            data_tobe_save['title'] = request.data.get('eventTitle')
            data_tobe_save['date'] = request.data.get('eventDate')
            data_tobe_save['description'] = request.data.get('eventDescription')
            data_tobe_save['status'] = request.data.get('eventStatus')
            data_tobe_save['company_id'] = request.data.get('eventStatus')
            data_tobe_save['created_by'] = user_data.id
            data_tobe_save['created_at'] = timezone.now()
            
            data_tobe_save['active'] = True

            data['company_id'] = company_id
            serializer = EventSerializer(data=data_tobe_save)
            if serializer.is_valid():
                print('ankit mishra')
                serializer.save()
                return Response({'message': 'Event created sucessfully'}, status=status.HTTP_201_CREATED)
            
            else:
                print('Serializer Errors:', serializer.errors)
                return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print('serializer error :::', serializer.errors)
            return Response({'error': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except Company.DoesNotExist:
            print('print company not exist')

        except Exception as e:
            print("Leave request error:", str(e))
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)



