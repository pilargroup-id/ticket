<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class ProjectResolveRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'actual_end_date'          => ['nullable'], // datetime
            'include_pending_minutes'  => ['nullable','boolean'],
            'description'              => ['nullable','string'],
        ];
    }
}
