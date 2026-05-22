<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class ProjectStartRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'developer_id'   => ['required', 'string', 'max:36'],
            'developer_name' => ['required', 'string', 'max:255'],
            'progress_date'    => ['nullable'], // datetime
            'progress_percent' => ['nullable','integer','min:0','max:100'],
            'description'      => ['nullable','string'],
        ];
    }
}
