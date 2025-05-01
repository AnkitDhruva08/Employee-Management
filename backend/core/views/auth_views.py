from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import make_password
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import permission_classes, api_view
from core.serializers import CompanySerializer, UserSerializer
from core.models import Company, Employee
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password

# User Model
User = get_user_model() 

#  Company Registration Views 
class CompanyRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):

        company_data = request.data.copy() 
        password = company_data.pop('password', None)

        if password is None:
            return Response({"error": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Extract values
            email = company_data.get('email')
            company_name = company_data.get('company_name')

            # Create the User
            user = User.objects.create(
                username=company_name,
                email=email,
                password=make_password(password),
                is_company=True
            )

            # Create Company and link it to the User
            company = Company.objects.create(user=user, **company_data)

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            # Serialize the Company
            serializer = CompanySerializer(company)

            return Response({
                'message': 'Registered Successfully',
                'status': 200,
                'data': serializer.data,
                'tokens': {
                    'access': access_token,
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

#  Login views Based on role and also for organization

class LoginLogoutView(APIView):
    """
    Handles both login (POST) and logout (DELETE) actions.
    - POST: Login and return JWT tokens
    - DELETE: Logout and invalidate token
    """

    def post(self, request):
        # LOGIN
        email = request.data.get("email")
        password = request.data.get("password")
        print('Login attempt from:', email)

        if not email or not password:
            return Response({"error": "Email and password required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid email or user does not exist"}, status=status.HTTP_404_NOT_FOUND)

        role_data = Employee.objects.filter(company_email=email).values('role_id').first()
        company_data = User.objects.filter(email=email).values('is_company').first()

        role_id = role_data['role_id'] if role_data else None
        is_company = company_data['is_company'] if company_data else None

        user = authenticate(request, username=user.username, password=password)
        if user:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Login successful!",
                "status": 200,
                "role_id": role_id,
                "is_company": is_company,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                },
                "session": "User session created successfully"
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

    def delete(self, request):
        # LOGOUT 
        print('Logout attempt from:', request.user.email)
        self.permission_classes = [IsAuthenticated]
        try:
            # Invalidate the token (if using token blacklisting or just log out)
            logout(request)
            return Response({"message": "Logout successful!"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
