# utils/pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CustomPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_page_size(self, request):
        page_size = request.query_params.get(self.page_size_query_param, self.page_size)
        try:
            page_size = int(page_size)
        except (ValueError, TypeError):
            page_size = self.page_size
        return min(page_size, self.max_page_size)

    def get_paginated_response(self, data, total_count = None):
        print('total_count is', total_count)
        return Response({
            'count': total_count,
            'page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'results': data
        })
