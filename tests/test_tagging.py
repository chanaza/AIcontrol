import unittest

from app.tagging import normalize_tags


class TagNormalizationTests(unittest.TestCase):
    def test_equivalent_vendor_tags_share_a_canonical_tag(self):
        openai_tags = normalize_tags("openai", ["production"], "Engineering")
        anthropic_tags = normalize_tags("anthropic", ["prod"], "Engineering")

        self.assertIn("environment:production", openai_tags)
        self.assertIn("environment:production", anthropic_tags)
        self.assertIn("department:engineering", openai_tags)
        self.assertIn("vendor:openai", openai_tags)
        self.assertIn("vendor:anthropic", anthropic_tags)


if __name__ == "__main__":
    unittest.main()
