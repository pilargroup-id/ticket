<?php

namespace App\Exports;

use App\Models\ProjectDetails;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class ProjectsDetailsExport implements
    FromQuery,
    WithMapping,
    WithHeadings,
    ShouldAutoSize,
    WithStyles,
    WithColumnFormatting
{
    private int $year;
    private ?string $status;
    private ?string $q;
    private int $rowNumber = 0;

    public function __construct(int $year, ?string $status = null, ?string $q = null)
    {
        $this->year = $year ?: (int) now()->year;
        $this->status = ($status && $status !== 'all') ? $status : null;
        $this->q = $q ?: null;
    }

    public function query()
    {
        return ProjectDetails::projectDetailsExportQuery([
            'year' => $this->year,
            'status' => $this->status,
            'q' => $this->q,
        ]);
    }

    public function headings(): array
    {
        return [
            'No',
            'Project Code',
            'Project Name',
            'Requestor',
            'Developer',

            'Progress Date',
            'Task Status',
            'Progress (%)',
            'Task Description',

            'Header Status',
            'Priority',
            'Is Late',
            'Request Date',
            'Start Date',
            'End Date',
        ];
    }

    public function map($r): array
    {
        $this->rowNumber++;

        return [
            $this->rowNumber,
            $r->project_code,
            $r->project_name,
            $r->requestor_name,
            $r->developer_name,

            $this->fmtDate($r->progress_date),
            $r->detail_status,
            (int) ($r->detail_progress_percent ?? 0),
            $r->detail_description,

            $r->header_status,
            $r->priority,
            ((int) ($r->is_late ?? 0)) ? 'Yes' : 'No',

            $this->fmtDateTime($r->request_date),
            $this->fmtDateTime($r->start_date),
            $this->fmtDateTime($r->end_date),
        ];
    }

    private function fmtDate($dt): ?string
    {
        if (!$dt) return null;
        try {
            return is_object($dt) ? $dt->format('Y-m-d') : date('Y-m-d', strtotime($dt));
        } catch (\Throwable $e) {
            return (string) $dt;
        }
    }

    private function fmtDateTime($dt): ?string
    {
        if (!$dt) return null;
        try {
            return is_object($dt) ? $dt->format('Y-m-d H:i:s') : date('Y-m-d H:i:s', strtotime($dt));
        } catch (\Throwable $e) {
            return (string) $dt;
        }
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->freezePane('A2');

        $sheet->getStyle('A1:O1')->getFont()->setBold(true);
        $sheet->getStyle('A1:O1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // wrap description
        $sheet->getStyle('I:I')->getAlignment()->setWrapText(true);
        $sheet->getStyle('A:O')->getAlignment()->setVertical(Alignment::VERTICAL_TOP);

        $sheet->getColumnDimension('I')->setWidth(60);

        return [];
    }

    public function columnFormats(): array
    {
        return [
            'A' => NumberFormat::FORMAT_NUMBER,
            'H' => NumberFormat::FORMAT_NUMBER, // progress %
        ];
    }
}
