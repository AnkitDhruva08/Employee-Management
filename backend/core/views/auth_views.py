from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import AllowAny
from core.serializers import CompanySerializer
from core.models import Company
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model

User = get_user_model()  # Add this after your imports




class CompanyRegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        print('User registration request:', request.data)

        # Extract the data from the request
        company_data = request.data
        print('company_data ==<<<>', company_data)

        # Extract password from the request data
        password = company_data.pop('password', None)

        if password is None:
            return Response({"error": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)
        

        # Hash the password before storing it
        hashed_password = make_password(password)
        try:
            # Create the User object
            user = User.objects.create(
                username=company_data['email'], 
                password=hashed_password, 
            )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Create the Company object and associate it with the user
            company = Company.objects.create(user=user, **company_data)

            # Serialize the company and return the response
            serializer = CompanySerializer(company)
            return Response( {'message': 'Registered Successfully', "status": 200, "data" : serializer.data, "tokens": {
                    "access": access_token,
                    "refresh": str(refresh)
                }}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CompanyLoginView(APIView):
    """
    Handle login for companies using email and password.
    Returns JWT token if credentials are correct.
    """
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        try:
            company = Company.objects.get(email=email)
        except Company.DoesNotExist:
            return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)

        # if not check_password(password, company.password):
        #     return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)

        # Generate token manually using SimpleJWT
        refresh = RefreshToken.for_user(company)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "company_id": company.id,
            "company_name": company.company_name
        })
