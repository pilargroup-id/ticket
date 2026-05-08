<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class TicketCollection extends ResourceCollection
{
    /**
     * Transform the resource collection into an array.
     */
    // TicketCollection.php
    public function toArray($request)
    {
        return $this->collection->map(function ($ticket) {
            return [
                'id'             => $ticket->id,
                'ticket_code'    => $ticket->ticket_code,
                'user_id'        => $ticket->user_id,
                'user_name'      => $ticket->user?->name,
                'nama_pembuat'      => $ticket->nama_pembuat,
                'support_id'     => $ticket->support_id,
                'support_name'   => $ticket->support?->name,
                'category_id'    => $ticket->category_id,
                'category_name'  => $ticket->category?->name,
                'asset_id'       => $ticket->assets_id,
                'asset_name'     => $ticket->assets?->assets_name,
                'status'         => $ticket->status,
                'priority'       => $ticket->priority,
                'problem'        => $ticket->problem,
                'image'          => $ticket->image ? url('storage/' . $ticket->image) : null,
                'solution'       => $ticket->solution,
                'notes'          => $ticket->notes,
                'request_date'   => $ticket->request_date?->format('Y-m-d H:i:s'),
                'waiting_hour'   => $ticket->waiting_hour,
                'start_date'     => $ticket->start_date?->format('Y-m-d H:i:s'),
                'end_date'       => $ticket->end_date?->format('Y-m-d H:i:s'),
                'time_spent'     => $ticket->time_spent,
                'is_late'        => $ticket->is_late,
                'created_at'     => $ticket->created_at?->format('Y-m-d H:i:s'),
                'updated_at'     => $ticket->updated_at?->format('Y-m-d H:i:s'),
            ];
        });
    }
}
