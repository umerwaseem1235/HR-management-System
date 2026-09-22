import { NextRequest, NextResponse } from 'next/server';
import { getEmployee, updateEmployee, deleteEmployee } from '@/lib/actions/employees';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const employee = await getEmployee(id);
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to fetch employee' }, { status: 404 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const employee = await updateEmployee(id, {
      employeeCode: body.employeeCode,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      dateOfBirth: body.dateOfBirth,
      gender: body.gender,
      address: body.address,
      city: body.city,
      country: body.country,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      departmentId: body.departmentId,
      designationId: body.designationId,
      branchId: body.branchId,
      shiftId: body.shiftId,
      reportingManagerId: body.reportingManagerId,
      employmentType: body.employmentType,
      joiningDate: body.joiningDate,
      probationEndDate: body.probationEndDate,
      confirmationDate: body.confirmationDate,
      status: body.status,
      bankName: body.bankName,
      bankAccount: body.bankAccount,
      taxId: body.taxId,
      salary: body.salary ? Number(body.salary) : undefined,
      avatar: body.avatar,
    });
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update employee' }, { status: 400 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteEmployee(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to delete employee' }, { status: 400 });
  }
}