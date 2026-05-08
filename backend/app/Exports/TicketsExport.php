<?php

namespace App\Exports;

use App\Models\Tickets;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class TicketsExport implements
    FromQuery,
    WithMapping,
    WithHeadings,
    ShouldAutoSize,
    WithStyles,
    WithColumnFormatting
{
    private ?string $status;
    private ?string $start;
    private ?string $end;
    private int $rowNumber = 0;

    // App/Exports/TicketsExport.php

public function __construct(?string $status = null, ?string $start = null, ?string $end = null)
{
    // jangan buang "resolved" ya, karena resolved itu special mapping
    $this->status = $status && $status !== 'all' ? $status : null;

    $this->start = $start ?: now()->startOfDay()->toDateString();
    $this->end   = $end   ?: now()->endOfDay()->toDateString();
}

public function query()
{
    return Tickets::query()
        ->with(['user:id,name','support:id,name','category:id,name','assets:id,assets_name'])
        ->whereBetween('created_at', ["{$this->start} 00:00:00", "{$this->end} 23:59:59"])
        ->when($this->status, fn($q) => $q->byStatus($this->status)) // ✅ resolved auto include feedback
        ->latest();
}


    public function headings(): array
    {
        return [
            'No',
            'Ticket Code',
            'User Name',
            'Support Name',
            'Category Name',
            'Assets Name',
            'Nama Pembuat',
            'Status',
            'Priority',
            'Problem',
            'Solution',
            'Notes',
            'Request Date',
            'Waiting Hour',
            'Start Date',
            'End Date',
            'Time Spent (Minutes)',
            'Time Spent (Human)',
            'Is Late',
            'Created At',
            'Updated At',
        ];
    }

    public function map($ticket): array
    {
        $this->rowNumber++;

        $timeSpentMinutes = (int) ($ticket->time_spent ?? 0);

        return [
            $this->rowNumber,
            $ticket->id,
            $ticket->ticket_code,
            $ticket->user?->name,
            $ticket->support?->name,
            $ticket->category?->name,
            $ticket->assets?->assets_name,
            $ticket->nama_pembuat,
            $ticket->status,
            $ticket->priority,
            $ticket->problem,
            $ticket->solution,
            $ticket->notes,
            $this->fmtDateTime($ticket->request_date),
            (int) ($ticket->waiting_hour ?? 0),
            $this->fmtDateTime($ticket->start_date),
            $this->fmtDateTime($ticket->end_date),

            $timeSpentMinutes,
            $this->humanMinutes($timeSpentMinutes),
            (bool) $ticket->is_late ? 'Yes' : 'No',

            $this->fmtDateTime($ticket->created_at),
            $this->fmtDateTime($ticket->updated_at),
        ];
    }

    private function fmtDateTime($dt): ?string
    {
        return $dt ? $dt->format('Y-m-d H:i:s') : null;
    }

    private function humanMinutes(int $minutes): string
    {
        $minutes = max(0, (int) $minutes);
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;

        if ($h > 0 && $m > 0) return "{$h} jam {$m} menit";
        if ($h > 0) return "{$h} jam";
        return "{$m} menit";
    }

    /**
     * Styling sheet (freeze header, wrap, align, border minimal)
     */
    public function styles(Worksheet $sheet)
    {
        // Freeze header row
        $sheet->freezePane('A2');

        // Wrap text biar problem/solution/notes ga kepotong
        $sheet->getStyle('A:Z')->getAlignment()->setVertical(Alignment::VERTICAL_TOP);
        $sheet->getStyle('N:P')->getAlignment()->setWrapText(true); // Problem/Solution/Notes (N,O,P)
        $sheet->getStyle('A1:Z1')->getFont()->setBold(true);

        // Biar header rapi
        $sheet->getStyle('A1:Z1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Lebarin kolom yang biasanya panjang (optional)
        $sheet->getColumnDimension('N')->setWidth(40); // Problem
        $sheet->getColumnDimension('O')->setWidth(40); // Solution
        $sheet->getColumnDimension('P')->setWidth(30); // Notes
        $sheet->getColumnDimension('Q')->setWidth(45); // Image URL

        return [];
    }

    /**
     * Column formatting (kalau mau angka jadi angka, date jadi text/format)
     */
    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_NUMBER, // No
            'B' => NumberFormat::FORMAT_NUMBER, // Ticket ID
            'D' => NumberFormat::FORMAT_NUMBER, // User ID
            'F' => NumberFormat::FORMAT_NUMBER, // Support ID
            'H' => NumberFormat::FORMAT_NUMBER, // Category ID
            'J' => NumberFormat::FORMAT_NUMBER, // Assets ID
            'S' => NumberFormat::FORMAT_NUMBER, // Waiting Hour
            'W' => NumberFormat::FORMAT_NUMBER, // Time Spent Minutes
            // Date columns kita output string "Y-m-d H:i:s" -> biar aman, ga usah excel-date (lebih konsisten)
        ];
    }
}
