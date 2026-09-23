export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          city: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'super_admin' | 'hr_manager' | 'employee' | null;
          avatar: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'super_admin' | 'hr_manager' | 'employee' | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'super_admin' | 'hr_manager' | 'employee' | null;
          avatar?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          id: string;
          name: string;
          head: string | null;
          employee_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          head?: string | null;
          employee_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          head?: string | null;
          employee_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      designations: {
        Row: {
          id: string;
          name: string;
          department_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          department_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          department_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      shifts: {
        Row: {
          id: string;
          name: string;
          start_time: string | null;
          end_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_time?: string | null;
          end_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      employees: {
        Row: {
          id: string;
          user_id: string | null;
          employee_code: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          avatar: string | null;
          date_of_birth: string | null;
          gender: 'Male' | 'Female' | 'Other' | null;
          address: string | null;
          city: string | null;
          country: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          department_id: string | null;
          designation_id: string | null;
          branch_id: string | null;
          shift_id: string | null;
          reporting_manager_id: string | null;
          employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
          joining_date: string;
          probation_end_date: string | null;
          confirmation_date: string | null;
          status: 'Active' | 'Inactive' | 'On Notice' | 'Probation';
          bank_name: string | null;
          bank_account: string | null;
          tax_id: string | null;
          salary: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          employee_code: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          avatar?: string | null;
          date_of_birth?: string | null;
          gender?: 'Male' | 'Female' | 'Other' | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          department_id?: string | null;
          designation_id?: string | null;
          branch_id?: string | null;
          shift_id?: string | null;
          reporting_manager_id?: string | null;
          employment_type?: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
          joining_date: string;
          probation_end_date?: string | null;
          confirmation_date?: string | null;
          status?: 'Active' | 'Inactive' | 'On Notice' | 'Probation';
          bank_name?: string | null;
          bank_account?: string | null;
          tax_id?: string | null;
          salary?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          employee_code?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          avatar?: string | null;
          date_of_birth?: string | null;
          gender?: 'Male' | 'Female' | 'Other' | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          emergency_contact_name?: string | null;
          emergency_contact_phone?: string | null;
          department_id?: string | null;
          designation_id?: string | null;
          branch_id?: string | null;
          shift_id?: string | null;
          reporting_manager_id?: string | null;
          employment_type?: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
          joining_date?: string;
          probation_end_date?: string | null;
          confirmation_date?: string | null;
          status?: 'Active' | 'Inactive' | 'On Notice' | 'Probation';
          bank_name?: string | null;
          bank_account?: string | null;
          tax_id?: string | null;
          salary?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          check_in: string | null;
          check_out: string | null;
          status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend';
          work_hours: number | null;
          overtime: number | null;
          notes: string | null;
          check_in_lat: number | null;
          check_in_lng: number | null;
          check_out_lat: number | null;
          check_out_lng: number | null;
          distance_from_office: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend';
          work_hours?: number | null;
          overtime?: number | null;
          notes?: string | null;
          check_in_lat?: number | null;
          check_in_lng?: number | null;
          check_out_lat?: number | null;
          check_out_lng?: number | null;
          distance_from_office?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          check_in?: string | null;
          check_out?: string | null;
          status?: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend';
          work_hours?: number | null;
          overtime?: number | null;
          notes?: string | null;
          check_in_lat?: number | null;
          check_in_lng?: number | null;
          check_out_lat?: number | null;
          check_out_lng?: number | null;
          distance_from_office?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      attendance_corrections: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          requested_check_in: string | null;
          requested_check_out: string | null;
          requested_status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend';
          reason: string | null;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          requested_check_in?: string | null;
          requested_check_out?: string | null;
          requested_status?: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend';
          reason?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          requested_check_in?: string | null;
          requested_check_out?: string | null;
          requested_status?: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend';
          reason?: string | null;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      holidays: {
        Row: {
          id: string;
          name: string;
          date: string;
          is_recurring: boolean | null;
          branch_id: string | null;
          type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          date: string;
          is_recurring?: boolean | null;
          branch_id?: string | null;
          type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          is_recurring?: boolean | null;
          branch_id?: string | null;
          type?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      leave_types: {
        Row: {
          id: string;
          name: string;
          days_allowed: number;
          carry_forward: boolean | null;
          color: string | null;
          period: 'month' | 'year' | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          days_allowed: number;
          carry_forward?: boolean | null;
          color?: string | null;
          period?: 'month' | 'year' | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          days_allowed?: number;
          carry_forward?: boolean | null;
          color?: string | null;
          period?: 'month' | 'year' | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leave_balances: {
        Row: {
          id: string;
          employee_id: string;
          leave_type_id: string;
          year: number;
          total: number | null;
          used: number | null;
          remaining: number | null;
          pending: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          leave_type_id: string;
          year: number;
          total?: number | null;
          used?: number | null;
          remaining?: number | null;
          pending?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          leave_type_id?: string;
          year?: number;
          total?: number | null;
          used?: number | null;
          remaining?: number | null;
          pending?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leave_requests: {
        Row: {
          id: string;
          employee_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
          days: number;
          reason: string | null;
          status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
          applied_on: string;
          approved_by: string | null;
          comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          leave_type_id: string;
          start_date: string;
          end_date: string;
          days: number;
          reason?: string | null;
          status?: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
          applied_on?: string;
          approved_by?: string | null;
          comments?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          leave_type_id?: string;
          start_date?: string;
          end_date?: string;
          days?: number;
          reason?: string | null;
          status?: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
          applied_on?: string;
          approved_by?: string | null;
          comments?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payslips: {
        Row: {
          id: string;
          employee_id: string;
          employee_name: string | null;
          month: string;
          year: number;
          basic_salary: number;
          allowances: Json;
          deductions: Json;
          gross_salary: number;
          net_salary: number;
          status: 'Draft' | 'Processed' | 'Finalized';
          generated_on: string;
          finalized_on: string | null;
          finalized_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          employee_id: string;
          employee_name?: string | null;
          month: string;
          year: number;
          basic_salary: number;
          allowances?: Json;
          deductions?: Json;
          gross_salary: number;
          net_salary: number;
          status?: 'Draft' | 'Processed' | 'Finalized';
          generated_on?: string;
          finalized_on?: string | null;
          finalized_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          employee_name?: string | null;
          month?: string;
          year?: number;
          basic_salary?: number;
          allowances?: Json;
          deductions?: Json;
          gross_salary?: number;
          net_salary?: number;
          status?: 'Draft' | 'Processed' | 'Finalized';
          generated_on?: string;
          finalized_on?: string | null;
          finalized_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payroll_runs: {
        Row: {
          id: string;
          month: string;
          month_index: number;
          year: number;
          status: string | null;
          total_gross: number | null;
          total_deductions: number | null;
          total_net: number | null;
          created_on: string;
          finalized_on: string | null;
          finalized_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          month: string;
          month_index: number;
          year: number;
          status?: string | null;
          total_gross?: number | null;
          total_deductions?: number | null;
          total_net?: number | null;
          created_on?: string;
          finalized_on?: string | null;
          finalized_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          month?: string;
          month_index?: number;
          year?: number;
          status?: string | null;
          total_gross?: number | null;
          total_deductions?: number | null;
          total_net?: number | null;
          created_on?: string;
          finalized_on?: string | null;
          finalized_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payroll_items: {
        Row: {
          id: string;
          payroll_run_id: string;
          employee_id: string;
          employee_name: string | null;
          department: string | null;
          basic_salary: number | null;
          allowances: Json;
          deductions: Json;
          paid_leave_days: number | null;
          unpaid_leave_days: number | null;
          absent_days: number | null;
          leave_deduction: number | null;
          gross_salary: number | null;
          total_allowances: number | null;
          total_deductions: number | null;
          net_salary: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payroll_run_id: string;
          employee_id: string;
          employee_name?: string | null;
          department?: string | null;
          basic_salary?: number | null;
          allowances?: Json;
          deductions?: Json;
          paid_leave_days?: number | null;
          unpaid_leave_days?: number | null;
          absent_days?: number | null;
          leave_deduction?: number | null;
          gross_salary?: number | null;
          total_allowances?: number | null;
          total_deductions?: number | null;
          net_salary?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payroll_run_id?: string;
          employee_id?: string;
          employee_name?: string | null;
          department?: string | null;
          basic_salary?: number | null;
          allowances?: Json;
          deductions?: Json;
          paid_leave_days?: number | null;
          unpaid_leave_days?: number | null;
          absent_days?: number | null;
          leave_deduction?: number | null;
          gross_salary?: number | null;
          total_allowances?: number | null;
          total_deductions?: number | null;
          net_salary?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      salary_components: {
        Row: {
          id: string;
          name: string;
          amount: number | null;
          kind: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          amount?: number | null;
          kind?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          amount?: number | null;
          kind?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          department_id: string | null;
          branch_id: string | null;
          vacancies: number | null;
          applicants: number | null;
          status: 'Open' | 'Closed' | 'On Hold';
          posted_date: string;
          closing_date: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          department_id?: string | null;
          branch_id?: string | null;
          vacancies?: number | null;
          applicants?: number | null;
          status?: 'Open' | 'Closed' | 'On Hold';
          posted_date?: string;
          closing_date?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          department_id?: string | null;
          branch_id?: string | null;
          vacancies?: number | null;
          applicants?: number | null;
          status?: 'Open' | 'Closed' | 'On Hold';
          posted_date?: string;
          closing_date?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      candidates: {
        Row: {
          id: string;
          job_id: string;
          name: string;
          email: string;
          phone: string | null;
          stage: 'Applied' | 'Screening' | 'Interview' | 'Selected' | 'Rejected' | 'Offer' | 'Hired';
          applied_date: string;
          resume: string | null;
          notes: string | null;
          rating: number | null;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          name: string;
          email: string;
          phone?: string | null;
          stage?: 'Applied' | 'Screening' | 'Interview' | 'Selected' | 'Rejected' | 'Offer' | 'Hired';
          applied_date?: string;
          resume?: string | null;
          notes?: string | null;
          rating?: number | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          stage?: 'Applied' | 'Screening' | 'Interview' | 'Selected' | 'Rejected' | 'Offer' | 'Hired';
          applied_date?: string;
          resume?: string | null;
          notes?: string | null;
          rating?: number | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      interviews: {
        Row: {
          id: string;
          candidate_id: string;
          date: string;
          time: string | null;
          mode: string | null;
          // Union: 004 migration names it `interviewer`, 005_ext names it `interviewer_name`.
          interviewer: string | null;
          interviewer_name: string | null;
          interviewer_id: string | null;
          round: string | null;
          status: string | null;
          // Removed by 005_drop_interview_feedback_rating on some projects; kept nullable.
          feedback: string | null;
          rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          date: string;
          time?: string | null;
          mode?: string | null;
          interviewer?: string | null;
          interviewer_name?: string | null;
          interviewer_id?: string | null;
          round?: string | null;
          status?: string | null;
          feedback?: string | null;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          date?: string;
          time?: string | null;
          mode?: string | null;
          interviewer?: string | null;
          interviewer_name?: string | null;
          interviewer_id?: string | null;
          round?: string | null;
          status?: string | null;
          feedback?: string | null;
          rating?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          candidate_id: string;
          salary: number | null;
          joining_date: string | null;
          status: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          salary?: number | null;
          joining_date?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          salary?: number | null;
          joining_date?: string | null;
          status?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          name: string;
          type: string;
          employee: string;
          uploaded_date: string;
          expiry_date: string | null;
          status: string;
          file_data: string | null;
          file_path: string | null;
          file_name: string | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string;
          employee?: string;
          uploaded_date?: string;
          expiry_date?: string | null;
          status?: string;
          file_data?: string | null;
          file_path?: string | null;
          file_name?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          employee?: string;
          uploaded_date?: string;
          expiry_date?: string | null;
          status?: string;
          file_data?: string | null;
          file_path?: string | null;
          file_name?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      candidate_history: {
        Row: {
          id: string;
          candidate_id: string;
          date: string;
          action: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          date?: string;
          action: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          date?: string;
          action?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      asset_assignments: {
        Row: {
          id: string;
          asset_id: string;
          employee_id: string;
          issue_date: string;
          return_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          asset_id: string;
          employee_id: string;
          issue_date: string;
          return_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          asset_id?: string;
          employee_id?: string;
          issue_date?: string;
          return_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          value: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      expense_claims: {
        Row: {
          id: string;
          employee_id: string;
          category: string;
          amount: number;
          date: string;
          description: string | null;
          status: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
          receipt_url: string | null;
          submitted_on: string;
          approved_by: string | null;
          reimbursed_on: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          category: string;
          amount: number;
          date: string;
          description?: string | null;
          status?: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
          receipt_url?: string | null;
          submitted_on?: string;
          approved_by?: string | null;
          reimbursed_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          category?: string;
          amount?: number;
          date?: string;
          description?: string | null;
          status?: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
          receipt_url?: string | null;
          submitted_on?: string;
          approved_by?: string | null;
          reimbursed_on?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      progress_entries: {
        Row: {
          id: string;
          employee_id: string;
          project_name: string;
          description: string | null;
          submission_date: string;
          created_on: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          project_name: string;
          description?: string | null;
          submission_date: string;
          created_on?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          project_name?: string;
          description?: string | null;
          submission_date?: string;
          created_on?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      daily_work: {
        Row: {
          id: string;
          employee_id: string;
          title: string;
          description: string | null;
          date: string;
          file_url: string | null;
          file_name: string | null;
          link: string | null;
          status: 'Submitted' | 'Approved' | 'Needs Revision';
          submitted_on: string;
          reviewed_by: string | null;
          review_comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          title: string;
          description?: string | null;
          date: string;
          file_url?: string | null;
          file_name?: string | null;
          link?: string | null;
          status?: 'Submitted' | 'Approved' | 'Needs Revision';
          submitted_on?: string;
          reviewed_by?: string | null;
          review_comments?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          title?: string;
          description?: string | null;
          date?: string;
          file_url?: string | null;
          file_name?: string | null;
          link?: string | null;
          status?: 'Submitted' | 'Approved' | 'Needs Revision';
          submitted_on?: string;
          reviewed_by?: string | null;
          review_comments?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      remote_requests: {
        Row: {
          id: string;
          employee_id: string;
          from_date: string;
          to_date: string;
          days: number;
          reason: string;
          work_plan: string | null;
          status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
          requested_on: string;
          reviewed_by: string | null;
          review_comments: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          from_date: string;
          to_date: string;
          days: number;
          reason: string;
          work_plan?: string | null;
          status?: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
          requested_on?: string;
          reviewed_by?: string | null;
          review_comments?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          from_date?: string;
          to_date?: string;
          days?: number;
          reason?: string;
          work_plan?: string | null;
          status?: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
          requested_on?: string;
          reviewed_by?: string | null;
          review_comments?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          name: string;
          type: string;
          serial_number: string;
          assigned_to: string | null;
          issue_date: string | null;
          return_date: string | null;
          condition: 'New' | 'Good' | 'Fair' | 'Damaged';
          status: 'Available' | 'Assigned' | 'Returned' | 'Retired';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          serial_number: string;
          assigned_to?: string | null;
          issue_date?: string | null;
          return_date?: string | null;
          condition?: 'New' | 'Good' | 'Fair' | 'Damaged';
          status?: 'Available' | 'Assigned' | 'Returned' | 'Retired';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          serial_number?: string;
          assigned_to?: string | null;
          issue_date?: string | null;
          return_date?: string | null;
          condition?: 'New' | 'Good' | 'Fair' | 'Damaged';
          status?: 'Available' | 'Assigned' | 'Returned' | 'Retired';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          message: string;
          type: string | null;
          read: boolean | null;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          message: string;
          type?: string | null;
          read?: boolean | null;
          link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          message?: string;
          type?: string | null;
          read?: boolean | null;
          link?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          user_name: string | null;
          module: string;
          action: string;
          record: string | null;
          previous_value: string | null;
          new_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_name?: string | null;
          module: string;
          action: string;
          record?: string | null;
          previous_value?: string | null;
          new_value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_name?: string | null;
          module?: string;
          action?: string;
          record?: string | null;
          previous_value?: string | null;
          new_value?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      performance_cycles: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          status: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date: string;
          end_date: string;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          status?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          employee_id: string;
          cycle_id: string | null;
          title: string;
          description: string | null;
          progress: number | null;
          status: 'Not Started' | 'In Progress' | 'Completed';
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          cycle_id?: string | null;
          title: string;
          description?: string | null;
          progress?: number | null;
          status?: 'Not Started' | 'In Progress' | 'Completed';
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          cycle_id?: string | null;
          title?: string;
          description?: string | null;
          progress?: number | null;
          status?: 'Not Started' | 'In Progress' | 'Completed';
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      performance_reviews: {
        Row: {
          id: string;
          employee_id: string;
          cycle_id: string;
          cycle_name: string | null;
          self_rating: number | null;
          manager_rating: number | null;
          status: 'Pending Self Review' | 'Pending Manager Review' | 'Completed';
          comments: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          cycle_id: string;
          cycle_name?: string | null;
          self_rating?: number | null;
          manager_rating?: number | null;
          status?: 'Pending Self Review' | 'Pending Manager Review' | 'Completed';
          comments?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          cycle_id?: string;
          cycle_name?: string | null;
          self_rating?: number | null;
          manager_rating?: number | null;
          status?: 'Pending Self Review' | 'Pending Manager Review' | 'Completed';
          comments?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_employee: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          user_id: string | null;
          employee_code: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          avatar: string | null;
          date_of_birth: string | null;
          gender: 'Male' | 'Female' | 'Other' | null;
          address: string | null;
          city: string | null;
          country: string | null;
          emergency_contact_name: string | null;
          emergency_contact_phone: string | null;
          department_id: string | null;
          designation_id: string | null;
          branch_id: string | null;
          shift_id: string | null;
          reporting_manager_id: string | null;
          employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
          joining_date: string;
          probation_end_date: string | null;
          confirmation_date: string | null;
          status: 'Active' | 'Inactive' | 'On Notice' | 'Probation';
          bank_name: string | null;
          bank_account: string | null;
          tax_id: string | null;
          salary: number | null;
          created_at: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      user_role: 'super_admin' | 'hr_manager' | 'employee';
      employment_type: 'Full-time' | 'Part-time' | 'Contract' | 'Intern';
      employee_status: 'Active' | 'Inactive' | 'On Notice' | 'Probation';
      gender_type: 'Male' | 'Female' | 'Other';
      attendance_status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend';
      leave_status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
      leave_period: 'month' | 'year';
      expense_status: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed';
      daily_work_status: 'Submitted' | 'Approved' | 'Needs Revision';
      remote_request_status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
      asset_status: 'Available' | 'Assigned' | 'Returned' | 'Retired';
      asset_condition: 'New' | 'Good' | 'Fair' | 'Damaged';
      candidate_stage: 'Applied' | 'Screening' | 'Interview' | 'Selected' | 'Rejected' | 'Offer' | 'Hired';
      job_status: 'Open' | 'Closed' | 'On Hold';
      payslip_status: 'Draft' | 'Processed' | 'Finalized';
      performance_status: 'Pending Self Review' | 'Pending Manager Review' | 'Completed';
      goal_status: 'Not Started' | 'In Progress' | 'Completed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}