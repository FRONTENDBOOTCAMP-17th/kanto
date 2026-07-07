$ErrorActionPreference = 'Stop'
$root = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { (Get-Location).Path }
$html = Get-Content (Join-Path $root 'docs\보고서\Kanto_페이지별_팀원_기여도.html') -Raw -Encoding UTF8
$m = [regex]::Match($html, 'const data=(\[[\s\S]*?\n\]);\nfunction avg')
if (-not $m.Success) { throw 'HTML 데이터 배열을 찾지 못했습니다.' }
$data = $m.Groups[1].Value | ConvertFrom-Json

Add-Type -AssemblyName System.Drawing
$tmp = Join-Path $root '.tmp-contribution-charts'
New-Item -ItemType Directory -Force -Path $tmp | Out-Null
$names = @('김도혁','박소유','이동근','임태형')
$colors = @([Drawing.Color]::FromArgb(49,88,165),[Drawing.Color]::FromArgb(239,123,69),[Drawing.Color]::FromArgb(57,165,123),[Drawing.Color]::FromArgb(139,97,194))
function New-Donut([int[]]$values,[string]$path) {
  $bmp=[Drawing.Bitmap]::new(700,700); $g=[Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode=[Drawing.Drawing2D.SmoothingMode]::AntiAlias; $g.Clear([Drawing.Color]::White)
  $rect=[Drawing.Rectangle]::new(35,35,630,630); $start=-90.0
  for($i=0;$i -lt 4;$i++){ $sweep=360.0*$values[$i]/100; $b=[Drawing.SolidBrush]::new($colors[$i]);$g.FillPie($b,$rect,$start,$sweep);$b.Dispose();$start+=$sweep }
  $b=[Drawing.SolidBrush]::new([Drawing.Color]::White);$g.FillEllipse($b,190,190,320,320);$b.Dispose()
  $f=[Drawing.Font]::new('Malgun Gothic',30,[Drawing.FontStyle]::Bold);$sf=[Drawing.StringFormat]::new();$sf.Alignment='Center';$sf.LineAlignment='Center';$b=[Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(38,53,84));$g.DrawString("종합`n기여도",$f,$b,[Drawing.RectangleF]::new(190,190,320,320),$sf)
  $b.Dispose();$f.Dispose();$sf.Dispose();$bmp.Save($path,[Drawing.Imaging.ImageFormat]::Png);$g.Dispose();$bmp.Dispose()
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $word.Documents.Add()
$sec=$doc.Sections.Item(1);$sec.PageSetup.Orientation=1;$sec.PageSetup.PageWidth=$word.CentimetersToPoints(29.7);$sec.PageSetup.PageHeight=$word.CentimetersToPoints(21);$sec.PageSetup.TopMargin=$word.CentimetersToPoints(1.4);$sec.PageSetup.BottomMargin=$word.CentimetersToPoints(1.2);$sec.PageSetup.LeftMargin=$word.CentimetersToPoints(1.6);$sec.PageSetup.RightMargin=$word.CentimetersToPoints(1.6)
function Add-Text([string]$text,[int]$size,[bool]$bold=$false,[int]$color=0,[int]$space=6){$p=$doc.Content.Paragraphs.Add();$p.Range.Text=$text;$p.Range.Font.Name='맑은 고딕';$p.Range.Font.Size=$size;$p.Range.Font.Bold=[int]$bold;if($color){$p.Range.Font.Color=$color};$p.SpaceAfter=$space;return $p}
function Break-Page(){ $r=$doc.Content;$r.Collapse(0);$r.InsertBreak(7) }

$p=Add-Text 'KANTO PROJECT · CONTRIBUTION REPORT' 11 $true 0xB47836 10
$p.SpaceBefore=85
Add-Text "페이지별 팀원 기여도`n분석 보고서" 34 $true 0x4F2C18 18 | Out-Null
Add-Text '기능 구현 · 디자인/UI · 추가 개선 항목별 기여율' 16 $false 0x9A7256 8 | Out-Null
Add-Text '대상: 김도혁 · 박소유 · 이동근 · 임태형  |  작성일: 2026. 07. 07.' 11 $false 0x9A7256 0 | Out-Null
Break-Page
Add-Text '산정 기준 및 해석 방법' 26 $true 0x4F2C18 15 | Out-Null
Add-Text '근거 자료' 15 $true 0xA55831 4 | Out-Null
Add-Text '팀원별 프로젝트 활동 보고서·정리 Excel 4종, 전체 Git 이력, 주도 PR 목록, WBS 단독/공동 담당 기록을 함께 사용했습니다.' 11 $false 0x5F5145 10 | Out-Null
Add-Text '비율 산정' 15 $true 0xA55831 4 | Out-Null
Add-Text '기능영역별 비병합 커밋과 작업 유형을 기본 점수로 삼고, 단독 주도 기능 및 현재 코드에 남은 구현을 보정했습니다. 각 항목 합계는 100%입니다.' 11 $false 0x5F5145 10 | Out-Null
Add-Text '항목 정의' 15 $true 0xA55831 4 | Out-Null
Add-Text "기능 구현: 신규 기능·데이터 연동`n디자인/UI: 레이아웃·반응형·접근성`n추가 개선: 버그·성능·리팩터링·보안" 11 $false 0x5F5145 10 | Out-Null
Add-Text '주의: 커밋은 작업시간과 동일하지 않으므로, 본 수치는 저장소에서 확인 가능한 결과물 기준의 상대 기여 추정치입니다.' 10 $false 0x777777 0 | Out-Null

$pageNo=3
foreach($d in $data){
  Break-Page
  $title=[string]$d[0];$route=[string]$d[1];$summary=[string]$d[2];$rows=$d[3]
  Add-Text ("PAGE {0:D2}   {1}" -f ($pageNo-2),$title) 23 $true 0x4F2C18 2 | Out-Null
  Add-Text $route 9 $false 0x8C7B6B 8 | Out-Null
  $table=$doc.Tables.Add($doc.Content.Paragraphs.Add().Range,1,2);$table.Columns.Item(1).Width=$word.CentimetersToPoints(17);$table.Columns.Item(2).Width=$word.CentimetersToPoints(8.5);$table.Borders.Enable=0
  $left=$table.Cell(1,1).Range;$left.Text=$summary+"`r`r";$left.Font.Name='맑은 고딕';$left.Font.Size=11
  $tot=@(0,0,0,0);$keys=@('기능 구현','디자인/UI','추가 개선')
  foreach($key in $keys){$vals=@($rows.$key);$left.InsertAfter("$key`r");$left.Paragraphs.Last.Range.Font.Bold=1;$left.Paragraphs.Last.Range.Font.Size=13;$parts=@();for($i=0;$i -lt 4;$i++){$parts+="$($names[$i]) $($vals[$i])%";$tot[$i]+=[int]$vals[$i]};$left.InsertAfter(($parts -join '   ')+"`r`r")}
  for($i=0;$i -lt 4;$i++){$tot[$i]=[math]::Round($tot[$i]/3)}
  $chart=Join-Path $tmp ("chart-{0:D2}.png" -f $pageNo);New-Donut $tot $chart
  $overall=@();for($i=0;$i -lt 4;$i++){$overall+="$($names[$i]) $($tot[$i])%"};$left.InsertAfter("종합 기여도  "+($overall -join '   ')+"`r")
  $right=$table.Cell(1,2).Range;$right.Text='';$picRange=$table.Cell(1,2).Range.Duplicate;$picRange.End=$picRange.End-1;$picRange.Collapse(1);$pic=$picRange.InlineShapes.AddPicture($chart);$pic.Width=$word.CentimetersToPoints(7);$pic.Height=$word.CentimetersToPoints(7)
  $table.Cell(1,2).Range.ParagraphFormat.Alignment=1
  Add-Text '근거: 팀원별 활동 보고서·Git·PR·WBS / 반올림으로 합계에 ±1% 오차 가능' 8 $false 0x888888 0 | Out-Null
  $pageNo++
}
$out=Join-Path $root 'docs\보고서\Kanto_페이지별_팀원_기여도.pdf'
$doc.SaveAs2($out,17)
$doc.Close(0);$word.Quit()
[Runtime.InteropServices.Marshal]::ReleaseComObject($doc)|Out-Null;[Runtime.InteropServices.Marshal]::ReleaseComObject($word)|Out-Null
Write-Output $out
