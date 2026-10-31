from types import SimpleNamespace
from unittest.mock import patch

from main import verify_email_logic

def test_verification():
    print("Running verification tests...")

    # Test valid email
    res1 = verify_email_logic("support@github.com", check_smtp=False, use_briteverify=False)
    print(f"Test 1 (github.com): status={res1['status']}, score={res1['score']}, has_mx={res1['domain']['has_mx']}")
    assert res1['syntax']['valid'] == True
    assert res1['domain']['has_mx'] == True

    # Test disposable email
    res2 = verify_email_logic("test@mailinator.com", check_smtp=False, use_briteverify=False)
    print(f"Test 2 (mailinator.com): is_disposable={res2['classification']['is_disposable']}, status={res2['status']}")
    assert res2['classification']['is_disposable'] == True

    # Test invalid syntax
    res3 = verify_email_logic("not-an-email", check_smtp=False)
    print(f"Test 3 (invalid syntax): valid={res3['syntax']['valid']}, status={res3['status']}")
    assert res3['syntax']['valid'] == False

    print("All verification logic tests passed successfully!")


def test_briteverify_requires_key():
    with patch("main.BRITEVERIFY_API_KEY", None), patch(
        "main.dns.resolver.resolve",
        return_value=[SimpleNamespace(exchange="mx.example.com.")],
    ), patch("main.requests.get") as briteverify_request:
        result = verify_email_logic("support@example.com", check_smtp=False)

    assert result["briteverify"]["error"] == "BRITEVERIFY_API_KEY is not configured."
    briteverify_request.assert_not_called()
    print("BriteVerify missing-key test passed successfully!")


if __name__ == "__main__":
    test_verification()
    test_briteverify_requires_key()
