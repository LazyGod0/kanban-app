from bcrypt import checkpw, gensalt, hashpw

def hash_passwd(password: str) -> str:
    """Hash password"""
    hashed_passwd = hashpw(password=password.encode("utf-8"), salt=gensalt())
    return hashed_passwd.decode('utf-8')

def check_passwd(password: str,hashed_password: str)-> bool:
    """Compare password between password and hash"""
    return checkpw(
        password=password.encode('utf-8'),
        hashed_password=hashed_password.encode('utf-8')
    )