import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, FileText, Building, Briefcase } from 'lucide-react';
import { ComplianceCheckResult, ComplianceRequirement } from '../services/ComplianceService';

interface ComplianceCheckerProps {
  complianceResult: ComplianceCheckResult | null;
  pdfText: string | null;
}

const ComplianceChecker: React.FC<ComplianceCheckerProps> = ({ complianceResult, pdfText }) => {
  if (!complianceResult || !pdfText) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-500">
          <FileText className="mx-auto h-12 w-12 mb-4" />
          <p>Upload a PDF document to check UK company compliance</p>
        </div>
      </div>
    );
  }

  const { analysis, recommendations, relatedLegislation } = complianceResult;

  return (
    <div className="space-y-6">
      {/* Company Analysis Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-3 mb-4">
          <Building className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Company Analysis</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Company Type</span>
            </div>
            <p className="text-blue-800">{analysis.companyType}</p>
            <p className="text-sm text-blue-600 mt-1">
              Confidence: {Math.round(analysis.confidence * 100)}%
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Sector</span>
            </div>
            <p className="text-green-800">{analysis.sector}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-900">Compliance Score</span>
            </div>
            <p className="text-purple-800 text-2xl font-bold">{analysis.complianceScore}%</p>
          </div>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detected Requirements */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold">Compliant Requirements</h3>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
              {analysis.detectedRequirements.length}
            </span>
          </div>

          <div className="space-y-3">
            {analysis.detectedRequirements.map((req) => (
              <ComplianceItem key={req.id} requirement={req} status="compliant" />
            ))}
          </div>
        </div>

        {/* Missing Requirements */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
            <h3 className="text-lg font-semibold">Missing Requirements</h3>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
              {analysis.missingRequirements.length}
            </span>
          </div>

          <div className="space-y-3">
            {analysis.missingRequirements.map((req) => (
              <ComplianceItem key={req.id} requirement={req} status="missing" />
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <h3 className="text-lg font-semibold">Recommendations</h3>
          </div>

          <div className="space-y-2">
            {recommendations.map((rec, index) => (
              <p key={index} className="text-gray-700 leading-relaxed">
                {rec.startsWith('URGENT:') ? (
                  <span className="font-semibold text-red-700">{rec}</span>
                ) : rec.startsWith('\n') ? (
                  <span className="block mt-3 font-medium text-gray-900">{rec.substring(1)}</span>
                ) : (
                  rec
                )}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Related Legislation */}
      {relatedLegislation.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <Info className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Related Legislation</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {relatedLegislation.map((doc, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">{doc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ComplianceItemProps {
  requirement: ComplianceRequirement;
  status: 'compliant' | 'missing';
}

const ComplianceItem: React.FC<ComplianceItemProps> = ({ requirement, status }) => {
  const isCompliant = status === 'compliant';

  return (
    <div className={`p-3 rounded-lg border ${isCompliant ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-start gap-3">
        {isCompliant ? (
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{requirement.title}</h4>
            {requirement.mandatory && (
              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs font-medium">
                Required
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-2">{requirement.description}</p>

          <div className="flex flex-wrap gap-1">
            {requirement.keywords.slice(0, 3).map((keyword, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                {keyword}
              </span>
            ))}
            {requirement.keywords.length > 3 && (
              <span className="text-xs text-gray-500">
                +{requirement.keywords.length - 3} more
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplianceChecker;