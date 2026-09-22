import { NextRequest, NextResponse } from 'next/server';
import { getEmployees, createEmployee, getLookupData, createEmployeeWithAuth } from '@/lib/actions/employees';

export async function GET() {
  try {
    const employees = await getEmployees();
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a request to create employee with auth account
    const isCreatingAccount = body.password && body.loginEmail;
    
    let employee;
    if (isCreatingAccount) {
      const { employee: newEmployee } = await createEmployeeWithAuth({
        employeeCode: body.employeeCode || undefined,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || undefined,
        dateOfBirth: body.dateOfBirth || undefined,
        gender: body.gender || undefined,
        address: body.address || undefined,
        city: body.city || undefined,
        country: body.country || undefined,
        emergencyContactName: body.emergencyContactName || undefined,
        emergencyContactPhone: body.emergencyContactPhone || undefined,
        departmentId: body.departmentId,
        designationId: body.designationId,
        branchId: body.branchId,
        shiftId: body.shiftId,
        reportingManagerId: body.reportingManagerId,
        employmentType: body.employmentType || 'Full-time',
        joiningDate: body.joiningDate,
        probationEndDate: body.probationEndDate || undefined,
        confirmationDate: body.confirmationDate || undefined,
        status: body.status || 'Active',
        bankName: body.bankName || undefined,
        bankAccount: body.bankAccount || undefined,
        taxId: body.taxId || undefined,
        salary: body.salary ? Number(body.salary) : undefined,
        avatar: body.avatar || undefined,
        password: body.password,
        loginEmail: body.loginEmail,
      });
      employee = newEmployee;
    } else {
      employee = await createEmployee({
        employeeCode: body.employeeCode || undefined,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone || undefined,
        dateOfBirth: body.dateOfBirth || undefined,
        gender: body.gender || undefined,
        address: body.address || undefined,
        city: body.city || undefined,
        country: body.country || undefined,
        emergencyContactName: body.emergencyContactName || undefined,
        emergencyContactPhone: body.emergencyContactPhone || undefined,
        departmentId: body.departmentId || undefined,
        designationId: body.designationId || undefined,
        branchId: body.branchId || undefined,
        shiftId: body.shiftId || undefined,
        reportingManagerId: body.reportingManagerId || undefined,
        employmentType: body.employmentType || 'Full-time',
        joiningDate: body.joiningDate,
        probationEndDate: body.probationEndDate || undefined,
        confirmationDate: body.confirmationDate || undefined,
        status: body.status || 'Active',
        bankName: body.bankName || undefined,
        bankAccount: body.bankAccount || undefined,
        taxId: body.taxId || undefined,
        salary: body.salary ? Number(body.salary) : undefined,
        avatar: body.avatar || undefined,
      });
    }
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to create employee' }, { status: 400 });
  }
}