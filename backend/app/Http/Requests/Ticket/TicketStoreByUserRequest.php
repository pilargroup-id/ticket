<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class TicketStoreByUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id'  => 'required|exists:categories,id',
            'problem'      => 'required|string',
            'nama_pembuat' => 'required|string|max:255',
            'image'        => 'nullable|file|max:10240',
        ];
    }
}