<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class TicketStoreByAdminRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'support_id' => 'required|exists:users,id',
            'category_id' => 'required|exists:categories,id',
            'assets_id' => 'nullable|exists:assets,id',
            'nama_pembuat' => 'required|string|max:1000',
            'problem' => 'required|string|max:1000',
            'status' => 'required|string|in:waiting,in_progress,resolved,void',
            'priority' => 'required|string|in:low,medium,high',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:5120', 
            'start_date' => 'sometimes|required_if:status,resolved,in_progress|date',
            'end_date'   => 'sometimes|required_if:status,resolved|date|after_or_equal:start_date',
            'time_spent'  => 'sometimes|required_if:status,resolved|integer|min:1',
            'solution'    => 'sometimes|required_if:status,resolved|string|max:1000',
            'notes'       => 'sometimes|required_if:status,resolved|string|max:1000',

        ];
    }
}
