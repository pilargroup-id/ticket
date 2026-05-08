<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class TicketStoreByUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
          return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
{
    return [
        'category_id' => 'required|exists:categories,id',
        'problem'     => 'required|string',
        'nama_pembuat'     => 'required|string',
        'image'       => 'nullable|file|max:10240', // max 10MB
    ];
}

}
