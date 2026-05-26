<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class TicketStoreByAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return \App\Helpers\AuthHelper::isAdmin($this);
    }

    public function rules(): array
    {
        return [
            'user_id'      => 'required|string|max:36',
            'support_id'   => 'required|string|max:36',
            'support_name' => 'nullable|string|max:255',
            'category_id'  => 'required|exists:categories,id',
            'assets_id'    => 'nullable|exists:assets,id',
            'nama_pembuat' => 'required|string|max:255',
            'problem'      => 'required|string|max:1000',
            'status'       => 'required|string|in:waiting,in_progress,resolved,void',
            'priority'     => 'required|string|in:low,medium,high',
            'image'        => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:5120',
            'start_date'   => 'sometimes|required_if:status,resolved,in_progress|date',
            'end_date'     => 'sometimes|required_if:status,resolved|date|after_or_equal:start_date',
            'time_spent'   => 'sometimes|required_if:status,resolved|integer|min:1',
            'solution'     => 'sometimes|required_if:status,resolved|string|max:1000',
            'notes'        => 'sometimes|required_if:status,resolved|string|max:1000',
        ];
    }
}