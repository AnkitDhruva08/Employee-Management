from django.template.loader import render_to_string
from weasyprint import HTML
from django.utils import timezone
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.models import Employee, Company

class EmployeePDFReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user_email = request.user.email

        # Determine user access
        company = Company.objects.filter(email=user_email).first()
        employee = Employee.objects.filter(company_email=user_email).first()

        if employee:
            employee_role = employee.role_id
            company_id = employee.company_id
            hr_company_name = Company.objects.get(id=company_id).company_name
        else:
            employee_role = None
            hr_company_name = company.company_name if company else "Unknown"

        if not company and not (employee_role == 2):
            return HttpResponse("Unauthorized", status=401)

        company_user = company if company else employee.company

        # Prefetch all related models
        employees = Employee.objects.filter(company=company_user, active=True).prefetch_related(
            'office_details', 'emergency_contacts', 'nominee_details', 'bank_details'
        )

        employee_data = []
        for emp in employees:
            office = emp.office_details.first() if emp.office_details.exists() else None
            bank = emp.bank_details.first() if emp.bank_details.exists() else None
            nominee = emp.nominee_details.first() if emp.nominee_details.exists() else None
            emergency = emp.emergency_contacts.first() if emp.emergency_contacts.exists() else None

            employee_data.append({
                'emp': emp,
                'office': office,
                'bank': bank,
                'nominee': nominee,
                'emergency': emergency,
            })
        # Render HTML
        html_string = render_to_string("employee_report_template.html", {
            "employees": employee_data,
            "generated_date": timezone.now().strftime("%B %d, %Y"),
            "company_name": hr_company_name,
        })

        # Generate PDF
        html = HTML(string=html_string)
        pdf_file = html.write_pdf()

        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="employee_report.pdf"'
        return response
