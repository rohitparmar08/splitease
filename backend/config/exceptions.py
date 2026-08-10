"""
Custom exception handler to return consistent JSON error structure:
{
    "success": False,
    "message": "Error description",
    "errors": {}
}
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "message": "Validation or execution error occurred.",
            "errors": {}
        }
        
        if isinstance(response.data, dict):
            if "detail" in response.data:
                custom_data["message"] = str(response.data["detail"])
            else:
                custom_data["errors"] = response.data
                custom_data["message"] = "Invalid request payload."
        elif isinstance(response.data, list):
            custom_data["errors"] = {"non_field_errors": response.data}
            custom_data["message"] = "Invalid request data."
            
        response.data = custom_data
    else:
        # Unexpected unhandled server exception
        response = Response({
            "success": False,
            "message": "Internal server error occurred.",
            "errors": {"detail": str(exc)}
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return response
