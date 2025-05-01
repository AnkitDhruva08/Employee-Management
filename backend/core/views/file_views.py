import os
from django.conf import settings
from django.http import FileResponse, Http404

def get_pdf(request, filename):
    print('filename:', filename)
    file_path = os.path.join(settings.MEDIA_ROOT, filename)
    print('file_path:', file_path)
    if os.path.exists(file_path):
        print('File exists.')
        return FileResponse(open(file_path, 'rb'), content_type='application/pdf')
    raise Http404("File not found.")

