import django_filters

from .models import Billboard, BillboardStatus, MediaType


class BillboardFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="base_price_per_day", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="base_price_per_day", lookup_expr="lte")
    city = django_filters.CharFilter(lookup_expr="icontains")
    state = django_filters.CharFilter(lookup_expr="icontains")
    country = django_filters.CharFilter(lookup_expr="icontains")
    media_type = django_filters.ChoiceFilter(choices=MediaType.choices)
    status = django_filters.ChoiceFilter(choices=BillboardStatus.choices)
    is_featured = django_filters.BooleanFilter()
    illuminated = django_filters.BooleanFilter()
    min_visibility = django_filters.NumberFilter(field_name="visibility_score", lookup_expr="gte")
    owner = django_filters.UUIDFilter(field_name="owner__id")

    class Meta:
        model = Billboard
        fields = [
            "media_type", "status", "is_featured", "illuminated",
            "city", "state", "country", "owner",
        ]
