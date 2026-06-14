import { json } from '@sveltejs/kit';
import { createSample, getAllSamples, getSampleById, updateSampleStatus, assignAppraiser, createSupplementaryRequest, getSupplementaryRequests, updateSupplementaryStatus, getStatistics, getAllAppraisers, getSampleFlowsDetailed, getRoleSpecificData, addReceptionCheck, getReceptionChecks, addSamplePhoto, getSamplePhotos, reportAbnormality, getAbnormalities, handleAbnormality, createOpinionDocument, getOpinionDocuments, submitOpinionDocumentForReview, reviewOpinionDocument, createUrgencyReminder, getUrgencyReminders, acknowledgeReminder, getOverdueSamples } from '$lib/server/samples.js';

export async function GET({ url, locals }) {
  if (!locals.user) {
    return json({ success: false, message: '未登录' }, { status: 401 });
  }

  try {
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'list':
        const filters = {
          status: url.searchParams.get('status'),
          priority: url.searchParams.get('priority'),
          keyword: url.searchParams.get('keyword'),
          assignedAppraiserId: url.searchParams.get('assignedAppraiserId')
        };
        const samples = getAllSamples(filters);
        return json({ success: true, samples });

      case 'get':
        const id = url.searchParams.get('id');
        const sample = getSampleById(id);
        if (!sample) {
          return json({ success: false, message: '样本不存在' }, { status: 404 });
        }
        return json({ success: true, sample });

      case 'flows':
        const sampleId = url.searchParams.get('sampleId');
        const flows = getSampleFlowsDetailed(sampleId);
        return json({ success: true, flows });

      case 'statistics':
        const stats = getStatistics();
        return json({ success: true, statistics: stats });

      case 'appraisers':
        const appraisers = getAllAppraisers();
        return json({ success: true, appraisers });

      case 'supplementary':
        const suppSampleId = url.searchParams.get('sampleId');
        const requests = getSupplementaryRequests(suppSampleId);
        return json({ success: true, requests });

      case 'roleData':
        const roleData = getRoleSpecificData(locals.user.id, locals.user.role);
        return json({ success: true, ...roleData });

      case 'receptionChecks':
        const checksSampleId = url.searchParams.get('sampleId');
        const checks = getReceptionChecks(checksSampleId);
        return json({ success: true, checks });

      case 'photos':
        const photosSampleId = url.searchParams.get('sampleId');
        const photos = getSamplePhotos(photosSampleId);
        return json({ success: true, photos });

      case 'abnormalities':
        const abnSampleId = url.searchParams.get('sampleId');
        const abnormalities = getAbnormalities(abnSampleId);
        return json({ success: true, abnormalities });

      case 'opinionDocs':
        const docSampleId = url.searchParams.get('sampleId');
        const documents = getOpinionDocuments(docSampleId);
        return json({ success: true, documents });

      case 'overdue':
        const overdueSamples = getOverdueSamples();
        return json({ success: true, samples: overdueSamples });

      default:
        return json({ success: false, message: '未知的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST({ request, locals }) {
  if (!locals.user) {
    return json({ success: false, message: '未登录' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const action = data.action;

    switch (action) {
      case 'create':
        const sampleData = {
          ...data,
          operatorId: locals.user.id,
          operatorName: locals.user.real_name,
          operatorRole: locals.user.role
        };
        const id = createSample(sampleData);
        return json({ success: true, id });

      case 'receive':
        updateSampleStatus(data.sampleId, 'received', locals.user.id, locals.user.real_name, locals.user.role, data.remarks, 'receive');
        return json({ success: true });

      case 'process':
        updateSampleStatus(data.sampleId, 'processing', locals.user.id, locals.user.real_name, locals.user.role, data.remarks, 'process');
        return json({ success: true });

      case 'complete':
        updateSampleStatus(data.sampleId, 'completed', locals.user.id, locals.user.real_name, locals.user.role, data.remarks, 'complete');
        return json({ success: true });

      case 'return':
        updateSampleStatus(data.sampleId, 'returned', locals.user.id, locals.user.real_name, locals.user.role, data.remarks, 'return');
        return json({ success: true });

      case 'reject':
        updateSampleStatus(data.sampleId, 'pending', locals.user.id, locals.user.real_name, locals.user.role, data.remarks, 'reject');
        return json({ success: true });

      case 'assign':
        assignAppraiser(data.sampleId, data.appraiserId, locals.user.id, locals.user.real_name, locals.user.role, data.remarks);
        return json({ success: true });

      case 'supplementary':
        const suppData = {
          ...data,
          requestedBy: locals.user.id,
          requestedByName: locals.user.real_name,
          operatorRole: locals.user.role
        };
        createSupplementaryRequest(data.sampleId, suppData);
        return json({ success: true });

      case 'supplementaryReceive':
        updateSupplementaryStatus(data.requestId, 'received', locals.user.id, locals.user.real_name);
        return json({ success: true });

      case 'addReceptionCheck':
        addReceptionCheck(data.sampleId, data.checkItem, data.checkResult, data.remarks, locals.user.id, locals.user.real_name);
        return json({ success: true });

      case 'addPhoto':
        const photoPath = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        addSamplePhoto(data.sampleId, data.photoType, photoPath, data.description, locals.user.id, locals.user.real_name);
        return json({ success: true, photoPath });

      case 'reportAbnormality':
        reportAbnormality(data.sampleId, data.abnormalityType, data.description, data.severity, locals.user.id, locals.user.real_name);
        return json({ success: true });

      case 'handleAbnormality':
        handleAbnormality(data.abnormalityId, data.handlingResult, locals.user.id, locals.user.real_name);
        return json({ success: true });

      case 'createOpinionDoc':
        createOpinionDocument(data.sampleId, data.documentTitle, data.documentContent, locals.user.id, locals.user.real_name);
        return json({ success: true });

      case 'submitOpinionDocReview':
        submitOpinionDocumentForReview(data.documentId, locals.user.id, locals.user.real_name);
        return json({ success: true });

      case 'reviewOpinionDoc':
        reviewOpinionDocument(data.documentId, data.status, data.reviewComments, locals.user.id, locals.user.real_name);
        return json({ success: true });

      case 'createReminder':
        createUrgencyReminder(data.sampleId, data.reminderType, data.title, data.message, data.targetUserId, locals.user.id, locals.user.real_name);
        return json({ success: true });

      case 'acknowledgeReminder':
        acknowledgeReminder(data.reminderId);
        return json({ success: true });

      default:
        return json({ success: false, message: '未知的操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('API error:', error);
    return json({ success: false, message: error.message }, { status: 500 });
  }
}
