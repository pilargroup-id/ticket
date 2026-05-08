<?php

namespace App\Http\Requests\ticket;

use Illuminate\Foundation\Http\FormRequest;

class TicketUpdateByUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
        'category_id'  => 'sometimes|required|exists:categories,id',
        'problem'      => 'sometimes|required|string',
        'nama_pembuat' => 'sometimes|required|string',
        'image'        => 'sometimes|nullable|image|max:10240', // max 1MB
        ];
    }
}
