import { formatCurrency } from '../utils/format';

function DetailRow({ label, value, highlight }) {
  return (
    <div className={`flex justify-between gap-4 py-2.5 border-b border-slate-800/80 last:border-0`}>
      <span className="text-sm text-slate-400 shrink-0">{label}</span>
      <span
        className={`text-sm font-medium text-right ${
          highlight ? 'text-cyan-300' : 'text-white'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function BillAnalysisResult({
  analysis,
  previewUrl,
  applied = false,
  transactionType,
}) {
  if (!analysis) return null;

  const {
    categoryLabel,
    categoryIcon,
    confidence,
    entries,
    suggestedTransaction,
    rawTextPreview,
  } = analysis;

  const isIncome = (transactionType || suggestedTransaction?.type) === 'income';
  const hasNutrition = entries.some((e) =>
    ['calories', 'protein', 'fat', 'carbs'].includes(e.key)
  );
  const hasUtility = entries.some((e) =>
    ['units', 'currentBill', 'savings'].includes(e.key)
  );
  const hasSalary = entries.some((e) =>
    ['netPay', 'grossPay', 'basicPay', 'employer'].includes(e.key)
  );

  return (
    <div className="space-y-4">
      {!applied && (
        <div className="flex flex-col sm:flex-row gap-4">
          {previewUrl && (
            <div className="shrink-0 w-full sm:w-40 h-40 rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
              <img src={previewUrl} alt="Uploaded bill" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">{categoryIcon}</span>
              <div>
                <p className="text-xs uppercase tracking-wider text-cyan-400 font-medium">
                  Detected Bill Type
                </p>
                <h3 className="text-xl font-bold text-white">{categoryLabel}</h3>
              </div>
              <span
                className={`ml-auto text-xs px-2.5 py-1 rounded-full capitalize ${
                  confidence === 'high'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : confidence === 'medium'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {confidence} confidence
              </span>
            </div>

            {suggestedTransaction.amount > 0 && (
              <p className="text-slate-300 text-sm mt-2">
                Will record as{' '}
                <span className={isIncome ? 'text-emerald-400' : 'text-rose-400'}>
                  {isIncome ? 'income' : 'expense'}
                </span>
                :{' '}
                <span className="font-semibold text-white">
                  {formatCurrency(suggestedTransaction.amount)}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {applied && (
        <h4 className="text-sm font-semibold text-slate-300">
          Extracted details from applied file
        </h4>
      )}

      {entries.length > 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-800/30 p-4">
          {!applied && (
            <h4 className="text-sm font-semibold text-slate-300 mb-3">
              {hasNutrition && 'Nutrition & Bill Details'}
              {hasSalary && !hasNutrition && 'Salary & Pay Details'}
              {hasUtility && !hasNutrition && !hasSalary && 'Usage & Bill Details'}
              {!hasNutrition && !hasUtility && !hasSalary && 'Extracted Details'}
            </h4>
          )}
          <div className="divide-y divide-slate-800/50">
            {entries.map((entry) => (
              <DetailRow
                key={entry.key}
                label={entry.label}
                value={entry.value}
                highlight={['total', 'currentBill', 'savings', 'calories', 'netPay', 'grossPay'].includes(
                  entry.key
                )}
              />
            ))}
          </div>
        </div>
      ) : (
        !applied && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200">
            Could not extract structured details. Try a clearer photo.
          </div>
        )
      )}

      {!applied && (
        <details className="rounded-xl border border-slate-800 bg-slate-900/50">
          <summary className="px-4 py-3 text-sm text-slate-400 cursor-pointer hover:text-slate-300">
            View raw extracted text
          </summary>
          <pre className="px-4 pb-4 text-xs text-slate-500 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
            {rawTextPreview || 'No text extracted'}
          </pre>
        </details>
      )}
    </div>
  );
}
