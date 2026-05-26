<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class TicketUpdateByAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return \App\Helpers\AuthHelper::isAdmin($this);
    }

    public function rules(): array
    {
        return [
            'support_id'   => 'sometimes|required|string|max:36',
            'support_name' => 'sometimes|nullable|string|max:255',
            'assets_id'    => 'sometimes|nullable|exists:assets,id',
            'status'       => 'sometimes|required|string|in:waiting,in_progress,resolved,void',
            'priority'     => 'sometimes|required|string|in:low,medium,high',
            'start_date'   => 'sometimes|required_if:status,resolved,in_progress|date',
            'end_date'     => 'sometimes|required_if:status,resolved|date|after_or_equal:start_date',
            'time_spent'   => 'sometimes|required_if:status,resolved|integer|min:1',
            'solution'     => 'sometimes|required_if:status,resolved|string|max:1000',
            'notes'        => 'sometimes|required_if:status,resolved|string|max:1000',
        ];
    }
}