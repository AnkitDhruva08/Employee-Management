from rest_framework import viewsets
from core.models import Event, Holiday
from core.serializers import EventSerializer, HolidaySerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer



