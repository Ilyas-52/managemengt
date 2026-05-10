export interface Agency {
    id: string;
    name: string;
    created_at?: string;
}

export interface Student {
    id: string;
    first_name: string;
    last_name: string;
    agence_id: string;
    created_at: string;
    [key: string]: any; // Allow for dynamic properties from different tables
}

export interface ScheduleData {
    [key: string]: {
        morning: string[];
        evening: string[];
        [key: string]: string[];
    };
}

export interface ExamResult {
    id: string;
    student_id: string;
    student_name?: string;
    theory_result?: string;
    theory_result_2?: string;
    practical_result?: string;
    practical_result_2?: string;
    practical_paid?: boolean;
    is_dora?: boolean;
    result: string;
    exam_date: string;
    agence_id: string;
    staff_name: string;
    [key: string]: any;
}

export interface AttendanceRecord {
    id: string;
    student_id: string;
    instructor_name: string;
    agence_id: string;
    lesson_date: string;
    extra_lessons?: number[];
    [key: string]: any;
}

export interface CashRecord {
    id: string;
    amount: number;
    type: 'recette' | 'depense';
    description: string;
    category: string;
    student_name?: string;
    external_name?: string;
    staff_name: string;
    agence_id: string;
    week_start_date?: string;
    created_at: string;
}

export interface VehicleLog {
    id?: string;
    balance?: number;
    mileage_start: number;
    mileage_end: number;
    fuel_expense: number;
    staff_name: string;
    week_start_date: string;
    agence_id: string;
    agency: string;
    updated_at: string;
}
