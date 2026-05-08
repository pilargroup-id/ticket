<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class TicketUpdateByAdminRequest extends FormRequest
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
            'support_id' => 'sometimes|required|exists:users,id',
            'assets_id' => 'sometimes|nullable|exists:assets,id',
            'status' => 'sometimes|required|string|in:waiting,in_progress,resolved,void',
            'priority' => 'sometimes|required|string|in:low,medium,high',
            'status' => 'sometimes|required|string|in:waiting,in_progress,resolved,void',
            'start_date' => 'sometimes|required_if:status,resolved,in_progress|date',
            'end_date'   => 'sometimes|required_if:status,resolved|date|after_or_equal:start_date',
            'time_spent'  => 'sometimes|required_if:status,resolved|integer|min:1',
            'solution'    => 'sometimes|required_if:status,resolved|string|max:1000',
            'notes'       => 'sometimes|required_if:status,resolved|string|max:1000',
        ];
    }
}
