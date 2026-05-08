<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class ProjectUpdateRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'status' => ['required','in:waiting,in_progress,pending,resolved,void'],

            // in_progress
            'developer_id'     => ['nullable','integer','exists:users,id'],
            'progress_date'    => ['nullable'],
            'progress_percent' => ['nullable','integer','min:0','max:100'],
            'description'      => ['nullable','string'],

            // pending
            'reason'                  => ['nullable','string'],
            'include_pending_minutes' => ['nullable','boolean'],

            // resolved
            'actual_end_date'          => ['nullable'],

            // void
            'notes' => ['nullable','string'],
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($v) {
            $status = $this->input('status');

            if ($status === 'in_progress') {
                if (!$this->input('developer_id')) $v->errors()->add('developer_id', 'developer_id wajib untuk in_progress');
            }

            if ($status === 'pending') {
                if (!$this->input('reason')) $v->errors()->add('reason', 'reason wajib untuk pending');
            }

            if ($status === 'void') {
                if (!$this->input('notes')) $v->errors()->add('notes', 'notes wajib untuk void');
            }
        });
    }
}
