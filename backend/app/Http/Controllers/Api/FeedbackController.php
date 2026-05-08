<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Feedback\FeedbackStoreRequest;
use App\Http\Resources\FeedbackResource;
use App\Models\Feedbacks;
use App\Models\Tickets;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(FeedbackStoreRequest $request, $id)
    {
        $dataFeedback = $request->validated();
        $dataFeedback['ticket_id'] = $id;
        $feedback = Feedbacks::create($dataFeedback);

        $ticket = Tickets::findOrFail($id);
        $ticket->update([
            'status' => 'feedback',
        ]);

        return response()->json([
            'message' => 'Feedback added successfully',
            'data' => [
                'feedback' => $feedback,
                'ticket' => $ticket,
            ],
        ], 201);
    }

    public function index()
    {
        return response()->json([
            'message' => 'Feedback fetch successfully',
            'data' => [
                'rating' => Feedbacks::rating(),
                'list' => FeedbackResource::collection(
                    Feedbacks::with('ticket')->get()
                ),
            ],
        ]);
    }
}
