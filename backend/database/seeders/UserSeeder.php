<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // ================================
        // 1. FULL DATA KARYAWAN (UPDATED)
        // ================================
        $employees = [
            ['Abdul Syukur', '', 'abdul.syukur', 'HUMAN CAPITAL'],
            ['Achmad Arifin', 'arifin@piagam.id', 'achmad.arifin', 'MARKETING'],
            ['Adam Ardiansyah', '', 'adam.ardiansyah', 'MARKETING'],
            ['Adelya Yowanda', 'adelya@piagam.id', 'adelya.yowanda', 'RETAIL ECOMMERCE'],
            ['Adi Prastyo', '', 'adi.prastyo', 'RETAIL ECOMMERCE'],
            ['Adi Saputra', '', 'adi.saputra', 'RETAIL ECOMMERCE'],
            ['Adi Bima Surahim', 'bima@piagam.id', 'adi.bima.surahim', 'RETAIL ECOMMERCE'],
            ['Adi Yoga Satrio', 'adi@piagam.id', 'adi', 'RETAIL ECOMMERCE'],
            ['Agam Nur Firdausy', 'agam@piagam.id', 'agam.nur.firdausy', 'PRODUCT'],
            ['Agitta Puspitarini', 'agitta@piagam.id', 'agitta.puspitarini', 'SUPPLY CHAIN'],
            ['Agus Rifaldi', 'purchase1@piagam.id', 'agus.rifaldi', 'PRODUCT'],
            ['Agus Supandi', '', 'agus.supandi', 'SUPPLY CHAIN'],
            ['Ahmad Asnawi', '', 'ahmad.asnawi', 'RETAIL ECOMMERCE'],
            ['Ajeng Devita Anugraini', '', 'Ajeng', 'RETAIL ECOMMERCE'],
            ['Al Fatih Zainul Falah', 'fatih@piagam.id', 'fatih', 'IT'],
            ['Andika Pratama', 'andika@piagam.id', 'andika.pratama', 'FINANCE'],
            ['Anggita Putri Susanti', '', 'anggita.putri.susanti', 'MARKETING'],
            ['Apriyanto', 'apri@piagam.id', 'apriyanto', 'IT'],
            ['Asep Ahmad Rohala', 'asep@piagam.id', 'asep.ahmad.rohala', 'RETAIL ECOMMERCE'],
            ['Audri Amelia Putri', '', 'audri.amelia.putri', 'STORE'],
            ['Azi Fauzi', 'azi@piagam.id', 'azi.fauzi', 'IT'],
            ['Bagas Sarwidianto', 'bagas@piagam.id', 'bagas.sarwidianto', 'MARKETING'],
            ['Bagja Hidayat', '', 'bagja.hidayat', 'SUPPLY CHAIN'],
            ['Bayu Noegroho', 'bayu@piagam.id', 'bayu', 'IT'],
            ['Bayu Prasetya', 'salesb2b.piagam@gmail.com', 'bayu.prasetya', 'SALES B2B'],
            ['Benediktus Gouzali', 'benediktus@piagam.id', 'benediktus.gouzali', 'BOARD OF DIRECTOR'],
            ['Benny', '', 'benny', 'SALES GT'],
            ['Bintang Oktarini Anggun', 'bintang@piagam.id', 'bintang.oktarini.anggun', 'FINANCE'],
            ['Cahyaningtyas Merry Nugraheni', 'cahya@piagam.id', 'cahyaningtyas.merry.nugraheni', 'HUMAN CAPITAL'],
            ['Chandra', 'chandra@piagam.id', 'chandra', 'SALES GT'],
            ['Ciptanty Tsaaniatun', 'ciptanty@piagam.id', 'ciptanty.tsaaniatun', 'MARKETING'],
            ['Cristianingsih', '', 'cristianingsih', 'RETAIL ECOMMERCE'],
            ['Damianus Gouzali', 'damianus@piagam.id', 'damianus.gouzali', 'BOARD OF DIRECTOR'],
            ['Danika Sevira Putri Aprilian', '', 'danika.sevira.putri.aprilian', 'RETAIL ECOMMERCE'],
            ['Dedy Supriadi', '', 'dedy.supriadi', 'SUPPLY CHAIN'],
            ['Delon Yahya', 'delon@piagam.id', 'delon.yahya', 'FINANCE'],
            ['Deni Setiawan', '', 'deni.setiawan', 'SUPPLY CHAIN'],
            ['Denny Kurniawan', 'denny@piagam.id', 'denny.kurniawan', 'SALES GT'],
            ['Dessy Manurung', 'dessy@piagam.id', 'dessy.manurung', 'PRODUCT'],
            ['Dewi Indrianti', '', 'dewi.indrianti', 'Pikasa'],
            ['Dian Gunawan', '', 'dian.gunawan', 'SUPPLY CHAIN'],
            ['Diyah Puji', '', 'diyah.puji', 'RETAIL ECOMMERCE'],
            ['Doni', '', 'doni', 'SUPPLY CHAIN'],
            ['Edi Siswanto', '', 'edi', 'SALES B2B'],
            ['Ega Listiani', '', 'ega.listiani', 'RETAIL ECOMMERCE'],
            ['Egy Irsandy', 'egy.irsandi@piagam.id', 'egy.irsandy', 'SALES GT'],
            ['Elvira Indri Safitri', 'elvira@piagam.id', 'elvira.indri.safitri', 'HUMAN CAPITAL'],
            ['Ema Sugi Yanah', 'ema@piagam.id', 'ema.sugi.yanah', 'FINANCE'],
            ['Ernest Hianto', 'ernest@piagam.id', 'ernest.hianto', 'PRODUCT'],
            ['Faizal Bastian Razaq', 'faizal@piagam.id', 'faizal.bastian.razaq', 'STORE'],
            ['FARAH INDRIYANI', '', 'farah', 'HUMAN CAPITAL'],
            ['Fathur Rohman', '', 'fathur.rohman', 'SUPPLY CHAIN'],
            ['Fatimah Raudhatul Jannah', '', 'fatimah.raudhatul.jannah', 'HUMAN CAPITAL'],
            ['Fitri Febri Susanti', '', 'fitri.febri.susanti', 'Pilkada'],
            ['Fitriyani', '', 'fitriyani', 'RETAIL ECOMMERCE'],
            ['Frisilia Ichma Sevia', '', 'frisilia.ichma.sevia', 'RETAIL ECOMMERCE'],
            ['Hani Apriani', '', 'hani.apriani', 'MARKETING'],
            ['Hendri', '', 'hendri', 'SALES GT'],
            ['Heni Widianti', 'heni@piagam.id', 'heni.widianti', 'RETAIL ECOMMERCE'],
            ['Herianto', '', 'herianto', 'SALES GT'],
            ['Hermanus Chrestofel M', '', 'hermanus.chrestofel.m', 'SALES B2B'],
            ['Herrafika Kusumahati', '', 'herrafika.kusumahati', 'RETAIL ECOMMERCE'],
            ['Hikma Alfaja Apriyani', '', 'hikma.alfaja.apriyani', 'RETAIL ECOMMERCE'],
            ['Hosea Geraldino', 'hosea@piagam.id', 'hosea.geraldino', 'FINANCE'],
            ['Ikhsan HL', '', 'ikhsan.hl', 'SUPPLY CHAIN'],
            ['Intang Citra Amanda', '', 'intang.citra.amanda', 'RETAIL ECOMMERCE'],
            ['Istiqma Nurfitriyah Adwili', 'istiqma@piagam.id', 'istiqma.nurfitriyah.adwili', 'RETAIL ECOMMERCE'],
            ['Iswandi Syahputra', '', 'iswandi.syahputra', 'RETAIL ECOMMERCE'],
            ['Ivon Yuanita Miharja', 'ivon@piagam.id', 'ivon.yuanita.miharja', 'LEGAL'],
            ['Jeanever', 'jeanever@piagam.id', 'jeanever', 'PRODUCT'],
            ['Johan Setyo Utomo', 'johan@piagam.id', 'johan.setyo.utomo', 'STORE'],
            ['Jumri', '', 'jumri', 'SUPPLY CHAIN'],
            ['Karmuji', '', 'karmuji', 'HUMAN CAPITAL'],
            ['Karna Illahi', '', 'karna.illahi', 'Pikasa'],
            ['Katherine', 'katherine@piagam.id', 'katherine', 'PRODUCT'],
            ['Ketty', 'ketty@piagam.id', 'ketty', 'FINANCE'],
            ['Kevin Phillips', 'kevin@piagam.id', 'kevin.phillips', 'FINANCE'],
            ['Khaerunisa', '', 'khaerunisa', 'RETAIL ECOMMERCE'],
            ['Khuzaima Desri Rahmadhani', '', 'khuzaima.desri.rahmadhani', 'PRODUCT'],
            ['Linda', 'linda@piagam.id', 'linda', 'SUPPLY CHAIN'],
            ['Lisianty Gouzali', 'lisianty@hotmail.com', 'lisianty.gouzali', 'BOARD OF DIRECTOR'],
            ['Loransjia Milazania Ongso', 'mila@piagam.id', 'loransjia.milazania.ongso', 'PRODUCT'],
            ['M.Rizky Fahrizal Lubis', 'rizky@piagam.id', 'm.rizky.fahrizal.lubis', 'RETAIL ECOMMERCE'],
            ['Marhatun Awaliah', 'awaliah@piagam.id', 'marhatun.awaliah', 'PRODUCT'],
            ['Masriati Indah Yani', '', 'masriati.indah.yani', 'RETAIL ECOMMERCE'],
            ['Matno Roso Gesang', '', 'matno.roso.gesang', 'RETAIL ECOMMERCE'],
            ['Maulana Sidik', '', 'maulana.sidik', 'SUPPLY CHAIN'],
            ['Melawati', '', 'melawati', 'PRODUCT'],
            ['Millenido Kresna Sejati', '', 'millenido.kresna.sejati', 'RETAIL ECOMMERCE'],
            ['Miswan', '', 'miswan', 'SUPPLY CHAIN'],
            ['Mohamad Bahudin', '', 'mohamad.bahudin', 'SALES GT'],
            ['Mohammad Fadly V\'Delon Syam', '', 'vdelon', 'HUMAN CAPITAL'],
            ['Muchammad Fajaryadi', '', 'muchammad.fajaryadi', 'Pikasa'],
            ['Muhamad Asep Hafidzul Umam', 'umam@piagam.id', 'muhamad.asep.hafidzul.umam', 'HUMAN CAPITAL'],
            ['Muhamad Ali', 'm.ali@piagam.id', 'muhamad.ali', 'RETAIL ECOMMERCE'],
            ['Muhamad Azrin', 'azrin@piagam.id', 'muhamad.azrin', 'STORE'],
            ['Muhamad Nurkhoirullah', '', 'muhamad.nurkhoirullah', 'RETAIL ECOMMERCE'],
            ['Muhamad Hafiz', '', 'muhamad.hafiz', 'RETAIL ECOMMERCE'],
            ['Muhamad Rifky Setiawan', '', 'muhamad.rifky.setiawan', 'RETAIL ECOMMERCE'],
            ['Muhammad Rizky', 'm.rizky@piagam.id', 'muhammad.rizky', 'STORE'],
            ['Muhammad Hisyam Ramdhani', '', 'muhammad.hisyam.ramdhani', 'RETAIL ECOMMERCE'],
            ['Muhammad Salman Alfarisi', '', 'muhammad.salman.alfarisi', 'HUMAN CAPITAL'],
            ['Muhammad Nurfathan Athaillah Humaedi', '', 'nurfathan', 'IT'],
            ['Mulyasi Rahardja', 'mulyasi@piagam.id', 'mulyasi.rahardja', 'FINANCE'],
            ['Nabila Nur Fauziah', 'nabila@piagam.id', 'nabila', 'MARKETING'],
            ['Nadia Salsabila', 'nadia@piagam.id', 'nadia', 'RETAIL ECOMMERCE'],
            ['Nafizka Nisa Azzahra', 'admin.gt@piagam.id', 'nafizka.nisa.azzahra', 'SUPPLY CHAIN'],
            ['Nanda Wahyuni', '', 'nanda.wahyuni', 'RETAIL ECOMMERCE'],
            ['Nasywa Isbah Hidayah', '', 'nasywa.isbah.hidayah', 'PRODUCT'],
            ['Nawawi', 'nawawi@piagam.id', 'nawawi', 'STORE'],
            ['Neneng Khodijah', 'neneng@piagam.id', 'neneng.khodijah', 'FINANCE'],
            ['Nurhadi Umar', 'nurhadi@piagam.id', 'nurhadi.umar', 'SALES B2B'],
            ['Nurhidayat Kamil Pratama', 'nurhidayat@piagam.id', 'Nurhidayat', 'RETAIL ECOMMERCE'],
            ['Nurma Dewi Pangestu', 'Nurma@piagam.id', 'nurma.dewi.pangestu', 'RETAIL ECOMMERCE'],
            ['Nurna Bella AP', 'anggi@piagam.id', 'nurna.bella.ap', 'SUPPLY CHAIN'],
            ['Nurul Hidayah', '', 'nurul.hidayah', 'RETAIL ECOMMERCE'],
            ['Pairan', '', 'pairan', 'FINANCE'],
            ['Prayugo Pangestu', '', 'prayugo.pangestu', 'SALES GT'],
            ['Rafli Al Qadri', '', 'rafli', 'HUMAN CAPITAL'],
            ['Rahmansyah', '', 'rahmansyah', 'FINANCE'],
            ['Rahmat Helan', 'rahmat@piagam.id', 'rahmat.helan', 'FINANCE'],
            ['Rangga Dwiekie Phrabaswara', '', 'rangga', 'PRODUCT'],
            ['Rara Azzahra', '', 'rara.azzahra', 'RETAIL ECOMMERCE'],
            ['Ray Christian Perangin-angin', 'ray.cp@piagam.id', 'ray.christian.perangin-angin', 'MARKETING'],
            ['Raziz Gandi', 'raziz@piagam.id', 'raziz.gandi', 'STORE'],
            ['Refi Indriyani', 'refi@piagam.id', 'refi', 'RETAIL ECOMMERCE'],
            ['Renaldy Alfarizi', 'renaldy@piagam.id', 'renaldy.alfarizi', 'HUMAN CAPITAL'],
            ['Rendi Mustapa', '', 'rendi.mustapa', 'RETAIL ECOMMERCE'],
            ['REZA PRASASTI', '', 'Reza', 'HUMAN CAPITAL'],
            ['Rifky Fajriansyah', 'rifky@piagam.id', 'rifky.fajriansyah', 'MARKETING'],
            ['Riko Muhammad Rizki', '', 'riko.muhammad.rizki', 'RETAIL ECOMMERCE'],
            ['Rina Rahayu', 'rina@piagam.id', 'rina.rahayu', 'FINANCE'],
            ['Rinovi Septiar', 'septiar@piagam.id', 'rinovi.septiar', 'Pilkada'],
            ['Rivaldo Ryos Hutapea', 'legal@piagam.id', 'rivaldo.ryos.hutapea', 'LEGAL'],
            ['Rizqi Armanda', 'rizqi@piagam.id', 'rizqi.armanda', 'PRODUCT'],
            ['Rodo Evan Bonatua', 'legal02@piagam.id', 'rodo', 'LEGAL'],
            ['Ropitasari', 'ropitasari@piagam.id', 'ropitasari', 'Pilkada'],
            ['Rosanna Mulak Roha Simanjorang', '', 'rosanna.mulak.roha.simanjorang', 'RETAIL ECOMMERCE'],
            ['Ryan Gagas Setiyanto', 'piagam.b2b@gmail.com', 'Ryan', 'SALES B2B'],
            ['Sahrul Ramadan', '', 'sahrul.ramadan', 'RETAIL ECOMMERCE'],
            ['Sandy Aprianto', 'sandy@piagam.id', 'sandy.aprianto', 'RETAIL ECOMMERCE'],
            ['Sarah Fadhilah', 'sarah@piagam.id', 'sarah.fadhilah', 'RETAIL ECOMMERCE'],
            ['Sefril Hidayat', '', 'sefril.hidayat', 'STORE'],
            ['Shoona Kabila Mahaaba', 'shoona@piagam.id', 'shoona.kabila.mahaaba', 'FINANCE'],
            ['Silvia Febriani', 'silvia@piagam.id', 'silvia.febriani', 'SALES GT'],
            ['Simon Gunawan Gouzali', 'simon@piagam.id', 'simon.gunawan.gouzali', 'BOARD OF DIRECTOR'],
            ['Siska Amelia', 'siska@piagam.id', 'siska.amelia', 'RETAIL ECOMMERCE'],
            ['Siti Rifdatul Adawiyah', 'rifda@piagam.id', 'siti.rifdatul.adawiyah', 'RETAIL ECOMMERCE'],
            ['Suheri', '', 'suheri', 'SUPPLY CHAIN'],
            ['Supply Chain Group', 'supplychain.operational@piagam.id', 'supply.chain.group', 'SUPPLY CHAIN'],
            ['Suwanto', '', 'Suwanto', 'SUPPLY CHAIN'],
            ['Syahrul Hadiana', '', 'syahrul.hadiana', 'Pikasa'],
            ['Tabita Maharani Wijaya', '', 'tabita', 'MARKETING'],
            ['Tamat Sodikin', '', 'tamat.sodikin', 'SUPPLY CHAIN'],
            ['Tiara Nur Azizah', 'tiara@piagam.id', 'tiara.nur.azizah', 'SUPPLY CHAIN'],
            ['Timothy Muryo Wiyoso', 'timothy@piagam.id', 'timothy.muryo.wiyoso', 'FINANCE'],
            ['Tri Ardiyansyah', '', 'tri.ardiyansyah', 'RETAIL ECOMMERCE'],
            ['Trijuariyogo', 'trijuariyogo@piagam.id', 'trijuariyogo', 'RETAIL ECOMMERCE'],
            ['Trinita', 'dc.admin@piagam.id', 'trinita', 'SUPPLY CHAIN'],
            ['Trisha', '', 'trisha', 'PRODUCT'],
            ['Tugino', '', 'tugino', 'HUMAN CAPITAL'],
            ['Tuti Hidayah', 'tuti.hidayah@piagam.id', 'tuti.hidayah', 'FINANCE'],
            ['Ujang Soparudin', '', 'ujang.soparudin', 'FINANCE'],
            ['Umar Sahid', '', 'umar.sahid', 'SUPPLY CHAIN'],
            ['Wahyuni', 'admin.sales@piagam.id', 'wahyuni', 'SALES GT'],
            ['Wandi Prawisnu Simanullang', 'wandi@piagam.id', 'wandi.prawisnu.simanullang', 'MARKETING'],
            ['Warsito', 'storegoto.coordinator@piagam.id', 'warsito', 'STORE'],
            ['Wawan Ridwan', '', 'wawan.ridwan', 'RETAIL ECOMMERCE'],
            ['Yopy Chandra', '', 'yopy.chandra', 'SUPPLY CHAIN'],
            ['Yosefhin Tesalonika', 'yose@piagam.id', 'yosefhin.tesalonika', 'FINANCE'],
            ['Yulliemty', 'yuli@piagam.id', 'yuli', 'IT'],
            ['Zaenal Mutakin', '', 'zaenal.mutakin', 'RETAIL ECOMMERCE'],
        ];

        // =========================================
        // 2. AMBIL DEPARTMENT ID DARI DATABASE
        // =========================================
        $departments = DB::table('departments')->pluck('id', 'department_name')->toArray();

        // =========================================
        // 3. INSERT USERS
        // =========================================
        foreach ($employees as $emp) {
            $departmentName = $emp[3];

            // Pastikan department ada di database
            if (!isset($departments[$departmentName])) {
                echo "Warning: Department '{$departmentName}' not found!\n";
                continue;
            }

            // Default role
            $roleId = 3;

            // Override role untuk beberapa orang
            $specialRoles = [
                'Azi Fauzi' => 1, // BOARD OF DIRECTOR
                'Bayu Noegroho'   => 1, // BOARD OF DIRECTOR
                'Apriyanto' => 1, // BOARD OF DIRECTOR
                'Al Fatih Zainul Falah'   => 1, // misal FINANCE head
                'Muhammad Nurfathan Athaillah Humaedi' => 2, // IT head
                'Yulliemty' => 2 // contoh role lain
            ];

            if (isset($specialRoles[$emp[0]])) {
                $roleId = $specialRoles[$emp[0]];
            }

            DB::table('users')->insert([
                'name'          => $emp[0],
                'email'         => $emp[1] ?: null,
                'username'      => strtolower($emp[2]),
                'department_id' => $departments[$departmentName],
                'role_id'       => $roleId,
                'password'      => bcrypt('piagam123'),
                'status'      => 'Active',
                'created_at'    => now(),
                'updated_at'    => now(),
            ]);
        }
    }
}
