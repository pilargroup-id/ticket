<?php

namespace App\Http\Requests\Project;

use Illuminate\Foundation\Http\FormRequest;

class ProjectStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            // project_code di-generate controller → optional / ignored
            'project_code'      => ['nullable','string','max:50'],

            'project_name'      => ['required','string','max:255'],
            'request_date'      => ['required'], // FE kirim ISO; controller parse via casts
            'requestor_id'      => ['required','integer','exists:users,id'],

            'status'            => ['nullable','in:waiting,in_progress,pending,resolved,void'],
            'priority'          => ['required','in:low,medium,high'],

            'progress_percent'  => ['nullable','integer','min:0','max:100'],
            'description'       => ['nullable','string'],
            'notes'             => ['nullable','string'],

            // planned dates (optional)
            'start_date'        => ['nullable'],
            'end_date'          => ['nullable'],
        ];
    }
}
