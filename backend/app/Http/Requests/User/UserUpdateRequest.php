<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === "admin";
    }

    public function rules(): array
    {
        $id = $this->route('id') ?? $this->route('user') ?? $this->id;

        return [
            'name'          => 'sometimes|required|string|max:255',
            'username'      => 'sometimes|required|string|unique:users,username,' . $id,
            'email'         => 'sometimes|nullable|string|email|unique:users,email,' . $id,
            'role'          => 'sometimes|nullable|in:admin,user',
            'phone'         => 'sometimes|nullable|string|max:20',
            'job_position'  => 'sometimes|nullable|string|max:100',
            'department_id' => 'nullable|exists:departments,id',

            // ✅ password optional, tapi kalau ada harus min 6
            'password'      => 'sometimes|nullable|string|min:6',
        ];
    }
}
