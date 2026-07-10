"""
Tests for the real-brand blocklist (no network, no env vars).
"""

from __future__ import annotations

import pytest

from catalog.blocklist import BLOCKLIST, contains_real_brand, find_real_brand_hits


class TestContainsRealBrand:
    # --- Should FAIL (real brands found) ---

    def test_amazon_exact(self):
        assert contains_real_brand("Amazon") is True

    def test_amazon_in_longer_string(self):
        assert contains_real_brand("Amazon Basics Ladle") is True

    def test_amazon_lowercase(self):
        assert contains_real_brand("amazon basics") is True

    def test_amazon_mixed_case(self):
        assert contains_real_brand("aMaZoN Prime") is True

    def test_tim_hortons_exact(self):
        assert contains_real_brand("Tim Hortons") is True

    def test_tim_hortons_lowercase(self):
        assert contains_real_brand("tim hortons") is True

    def test_timmies(self):
        assert contains_real_brand("timmies") is True

    def test_timmies_uppercase(self):
        assert contains_real_brand("TIMMIES") is True

    def test_uber(self):
        assert contains_real_brand("Uber Eats Competitor") is True

    def test_doordash(self):
        assert contains_real_brand("DoorDash Clone") is True

    def test_starbucks_in_sentence(self):
        assert contains_real_brand("Just like Starbucks but worse") is True

    def test_walmart(self):
        assert contains_real_brand("Walmart-style inventory") is True

    def test_costco(self):
        assert contains_real_brand("Costco bulk") is True

    def test_fedex(self):
        assert contains_real_brand("FedEx speed") is True

    def test_mcdonald(self):
        assert contains_real_brand("McDonald's style") is True

    def test_shopify(self):
        assert contains_real_brand("Shopify powered") is True

    def test_ikea(self):
        assert contains_real_brand("IKEA shelving") is True

    def test_coca_cola(self):
        assert contains_real_brand("Coca-Cola flavour") is True

    def test_pepsi(self):
        assert contains_real_brand("pepsi taste") is True

    def test_google(self):
        assert contains_real_brand("Google Maps data") is True

    def test_netflix(self):
        assert contains_real_brand("Netflix and wait") is True

    def test_loblaws(self):
        assert contains_real_brand("loblaws style") is True

    def test_sobeys(self):
        assert contains_real_brand("Sobeys grocery") is True

    def test_metro_inc(self):
        assert contains_real_brand("metro inc stores") is True

    def test_skipthedishes(self):
        assert contains_real_brand("skipthedishes") is True

    def test_skip_the_dishes_with_spaces(self):
        assert contains_real_brand("skip the dishes delivery") is True

    def test_instacart(self):
        assert contains_real_brand("Instacart style") is True

    def test_dhl(self):
        assert contains_real_brand("DHL shipping") is True

    def test_purolator(self):
        assert contains_real_brand("Purolator next-day") is True

    def test_ebay(self):
        assert contains_real_brand("eBay auction") is True

    def test_etsy(self):
        assert contains_real_brand("Etsy-like marketplace") is True

    # --- Should PASS (clean fictional names) ---

    def test_almost_foods_passes(self):
        assert contains_real_brand("Almost Foods Co.") is False

    def test_perpetual_provisions_passes(self):
        assert contains_real_brand("Perpetual Provisions") is False

    def test_waiting_room_bistro_passes(self):
        assert contains_real_brand("The Waiting Room Bistro") is False

    def test_adequate_supply_passes(self):
        assert contains_real_brand("Adequate Supply Co.") is False

    def test_eventually_yours_passes(self):
        assert contains_real_brand("Eventually Yours Delivery") is False

    def test_deadpan_review_passes(self):
        assert contains_real_brand("It has not arrived. I am at peace with this.") is False

    def test_empty_string_passes(self):
        assert contains_real_brand("") is False

    # --- Word-boundary + pruned-generic behaviour: everyday catalog words pass ---

    def test_upscale_passes(self):
        # "ups" is not on the list and boundaries prevent substring hits anyway
        assert contains_real_brand("upscale dining") is False

    def test_cups_passes(self):
        assert contains_real_brand("Two cups of lukewarm soup") is False

    def test_pineapple_passes(self):
        assert contains_real_brand("Pineapple upside-down cake") is False

    def test_apple_pie_passes(self):
        # "apple" the fruit is legitimate catalog content; not on the list
        assert contains_real_brand("Heritage apple pie, serves nobody") is False

    def test_prime_rib_passes(self):
        assert contains_real_brand("Prime rib, medium, in transit forever") is False

    def test_subway_sandwich_passes(self):
        # generic word, deliberately excluded from the list
        assert contains_real_brand("Subway-adjacent sandwich experience") is False

    def test_word_boundary_still_catches_brand_in_sentence(self):
        assert contains_real_brand("faster than amazon, allegedly") is True

    def test_fictional_delivery_name_passes(self):
        assert contains_real_brand("Forthcoming Parcels Ltd.") is False

    def test_deadpan_product_description_passes(self):
        assert contains_real_brand("A biscuit that ships eventually. Usually by Tuesday.") is False


class TestFindRealBrandHits:
    def test_finds_multiple_hits(self):
        hits = find_real_brand_hits("Amazon and DoorDash delivery")
        assert "amazon" in hits
        assert "doordash" in hits

    def test_no_hits(self):
        hits = find_real_brand_hits("Perpetual Provisions")
        assert hits == []

    def test_case_insensitive(self):
        hits = find_real_brand_hits("STARBUCKS")
        assert "starbucks" in hits
