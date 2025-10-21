import React from 'react';
import QuickEditDocument from './QuickEditDocument';
import QuickEditProcess from './QuickEditProcess';
import Loading from '../common/Loading';
import InlineToast from '../common/InlineToast';

const QuickEditManager = ({ id, type, canEdit, title }) => {
  if (!id || !type) {
    return <InlineToast type="error" message="QuickEditManager missing id or type" sticky />;
  }
  if (type === 'document') return <QuickEditDocument docId={id} canEdit={canEdit} />;
  if (type === 'process') return <QuickEditProcess processId={id} canEdit={canEdit} />;
  return <Loading text={`Unsupported type: ${type}`} />;
};

export default QuickEditManager;
