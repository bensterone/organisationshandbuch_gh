const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * GET /api/processes/by-navigation/:navigationItemId
 */
router.get('/by-navigation/:navigationItemId', authenticate, async (req, res, next) => {
  try {
    const [process] = await query(
      `SELECT pd.*, ni.title
       FROM process_definitions pd
       JOIN navigation_items ni ON pd.navigation_item_id = ni.id
       WHERE pd.navigation_item_id = ?`,
      [req.params.navigationItemId]
    );
    if (!process) return res.status(404).json({ error: 'Process not found' });
    res.json(process);
  } catch (err) { next(err); }
});

/**
 * GET /api/processes/:id
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [process] = await query(
      `SELECT pd.*, ni.title
       FROM process_definitions pd
       JOIN navigation_items ni ON pd.navigation_item_id = ni.id
       WHERE pd.id = ?`,
      [req.params.id]
    );
    if (!process) return res.status(404).json({ error: 'Process not found' });
    res.json(process);
  } catch (err) { next(err); }
});

/**
 * GET /api/processes/:id/links
 */
router.get('/:id/links', authenticate, async (req, res, next) => {
  try {
    const links = await query(`
      SELECT dl.*, ni.title AS document_title, ni.type AS document_type
      FROM document_links dl
      JOIN navigation_items ni ON dl.linked_navigation_item_id = ni.id
      WHERE dl.process_definition_id = ?
      ORDER BY dl.bpmn_element_id, dl.sort_order
    `, [req.params.id]);
    res.json(links);
  } catch (err) { next(err); }
});

/**
 * PUT /api/processes/:id  (update BPMN xml)
 */
router.put('/:id', authenticate, authorize('editor', 'admin'), async (req, res, next) => {
  try {
    const { bpmn_xml } = req.body;
    if (!bpmn_xml) return res.status(400).json({ error: 'bpmn_xml required' });
    await query(
      `UPDATE process_definitions SET bpmn_xml=?, updated_at=NOW(), updated_by=? WHERE id=?`,
      [bpmn_xml, req.user.id, req.params.id]
    );
    res.sendStatus(204);
  } catch (err) { next(err); }
});

module.exports = router;
