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
            'developer_id'   => ['required', 'string', 'max:36'],
            'developer_name' => ['required', 'string', 'max:255'],
            'description'             => ['nullable','string'],
        ];
    }
}
