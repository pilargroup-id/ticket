<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class ProjectUnholdRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'include_pending_minutes' => ['nullable','boolean'],
            'developer_id'            => ['nullable','integer','exists:users,id'], // optional pindah dev
            'description'             => ['nullable','string'],
        ];
    }
}
