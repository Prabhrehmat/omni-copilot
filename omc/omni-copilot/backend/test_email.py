"""
Test script to verify email sending works directly.
Run this to test if Gmail API is working properly.
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.google_service import send_gmail


async def test_send_email():
    """Test sending an email directly."""
    print("Testing Gmail API...")
    print("-" * 50)
    
    # Test email details
    to_email = input("Enter recipient email: ").strip()
    subject = input("Enter subject: ").strip() or "Test Email from OmniCopilot"
    body = input("Enter body (or press Enter for default): ").strip() or "This is a test email sent from OmniCopilot to verify Gmail API is working."
    
    print(f"\nSending email to: {to_email}")
    print(f"Subject: {subject}")
    print(f"Body: {body[:50]}...")
    print("-" * 50)
    
    try:
        result = await send_gmail(to=to_email, subject=subject, body=body)
        print("\n✅ SUCCESS! Email sent successfully!")
        print(f"Message ID: {result.get('id', 'N/A')}")
        print(f"Thread ID: {result.get('threadId', 'N/A')}")
        print(f"Label IDs: {result.get('labelIds', [])}")
        print("\nCheck your Gmail Sent folder to verify the email was sent.")
        return True
    except ValueError as e:
        print(f"\n❌ CONFIGURATION ERROR:")
        print(str(e))
        return False
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}")
        print(f"Details: {str(e)}")
        return False


if __name__ == "__main__":
    print("=" * 50)
    print("Gmail API Test Script")
    print("=" * 50)
    print()
    
    success = asyncio.run(test_send_email())
    
    print()
    print("=" * 50)
    if success:
        print("✅ Test PASSED - Gmail API is working!")
    else:
        print("❌ Test FAILED - Check the error messages above")
    print("=" * 50)
