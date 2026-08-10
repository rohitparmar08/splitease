from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model, authenticate
from django.db.models import Q
from drf_spectacular.utils import extend_schema

from .serializers import (
    UserSerializer,
    RegisterSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer
)

User = get_user_model()

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=RegisterSerializer, responses={201: UserSerializer})
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                "success": True,
                "message": "User registered successfully.",
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response({
            "success": False,
            "message": "Registration failed.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(responses={200: UserSerializer})
    def post(self, request):
        identifier = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({
                "success": False,
                "message": "Please provide both email/username and password.",
                "errors": {}
            }, status=status.HTTP_400_BAD_REQUEST)

        # Allow login by email or username
        user_obj = User.objects.filter(Q(email__iexact=identifier) | Q(username__iexact=identifier)).first()
        if user_obj:
            user = authenticate(username=user_obj.email, password=password)
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    "success": True,
                    "message": "Login successful.",
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    }
                }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "message": "Invalid email/username or password.",
            "errors": {}
        }, status=status.HTTP_401_UNAUTHORIZED)

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(responses={200: UserSerializer})
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            "success": True,
            "user": serializer.data
        }, status=status.HTTP_200_OK)

    @extend_schema(request=UserProfileUpdateSerializer, responses={200: UserSerializer})
    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "success": True,
                "message": "Profile updated successfully.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response({
            "success": False,
            "message": "Failed to update profile.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer)
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({
                    "success": False,
                    "message": "Incorrect old password.",
                    "errors": {"old_password": ["Incorrect current password."]}
                }, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({
                "success": True,
                "message": "Password changed successfully."
            }, status=status.HTTP_200_OK)

        return Response({
            "success": False,
            "message": "Password change failed.",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class UserSearchView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_queryset(self):
        query = self.request.query_params.get('q', '').strip()
        if not query:
            return User.objects.none()
        return User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query) | Q(full_name__icontains=query)
        ).exclude(id=self.request.user.id)[:20]
