<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'ticket_code'    => $this->ticket_code,
            'user_id'        => $this->user_id,
            'user_name'      => $this->user?->name,
            'support_id'     => $this->support_id,
            'support_name'   => $this->support?->name,
            'category_id'    => $this->category_id,
            'category_name'  => $this->category?->name,
            'assets_id'      => $this->assets_id,
            'assets_name'    => $this->assets?->assets_name,
            'nama_pembuat'    => $this->nama_pembuat,
            'status'         => $this->status,
            'priority'       => $this->priority,
            'problem'        => $this->problem,
            'image_url' => $this->image ? asset('storage/'.$this->image) : null,
            'solution'       => $this->solution,
            'notes'          => $this->notes,
            'request_date'   => $this->request_date?->format('Y-m-d H:i:s'),
            'waiting_hour'   => $this->waiting_hour,
            'start_date'     => $this->start_date?->format('Y-m-d H:i:s'),
            'end_date'       => $this->end_date?->format('Y-m-d H:i:s'),
            'time_spent'     => $this->time_spent,
            'is_late'        => $this->is_late,
            'created_at'     => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at'     => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}
