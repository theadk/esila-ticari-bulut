const fs = require('fs');
let code = fs.readFileSync('components/PuantajMaasView.tsx', 'utf8');

const perfState = `
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [performanceForm, setPerformanceForm] = useState<Partial<PerformanceScore>>({
    score: 80,
    notes: '',
  });

  const handleOpenPerformanceModal = (pId: string) => {
    const existing = performanceScores?.find((s) => s.personnelId === pId && s.month === selectedMonth);
    setPerformanceForm({
      score: existing ? existing.score : 80,
      notes: existing ? existing.notes : '',
    });
    setSelectedPersonnel(pId);
    setIsPerformanceModalOpen(true);
  };

  const handleSavePerformance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPersonnel || performanceForm.score === undefined) return;

    const existingIndex = (performanceScores || []).findIndex(
      (s) => s.personnelId === selectedPersonnel && s.month === selectedMonth
    );

    const newScore: PerformanceScore = {
      id: existingIndex >= 0 ? performanceScores[existingIndex].id : crypto.randomUUID(),
      personnelId: selectedPersonnel,
      month: selectedMonth,
      score: Number(performanceForm.score),
      notes: performanceForm.notes || '',
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      const updated = [...performanceScores];
      updated[existingIndex] = newScore;
      setPerformanceScores(updated);
    } else {
      setPerformanceScores([...(performanceScores || []), newScore]);
    }
    setIsPerformanceModalOpen(false);
  };
`;

if (!code.includes('isPerformanceModalOpen')) {
  code = code.replace(
    'const [expandedPersonnelId, setExpandedPersonnelId] = useState<string | null>(null);',
    'const [expandedPersonnelId, setExpandedPersonnelId] = useState<string | null>(null);\n' + perfState
  );
  fs.writeFileSync('components/PuantajMaasView.tsx', code);
  console.log('patched perf state');
}
