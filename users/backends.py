from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

UserModel = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        print(f"🔐 AUTHENTICATION BACKEND CALLED")
        print(f"📧 Username/Email provided: {username}")
        
        try:
            # Try to find user by email or username
            user = UserModel.objects.get(
                Q(email__iexact=username) | Q(username__iexact=username)
            )
            print(f"✅ User found in backend: {user.email}")
        except UserModel.DoesNotExist:
            print("❌ User not found in backend")
            return None
        except UserModel.MultipleObjectsReturned:
            print("⚠️ Multiple users found")
            user = UserModel.objects.filter(
                Q(email__iexact=username) | Q(username__iexact=username)
            ).order_by('id').first()

        if user and user.check_password(password):
            print("✅ Backend password check PASSED")
            if self.user_can_authenticate(user):
                print("✅ User can authenticate")
                return user
            else:
                print("❌ User cannot authenticate (inactive or other issue)")
        else:
            print("❌ Backend password check FAILED")
            
        return None