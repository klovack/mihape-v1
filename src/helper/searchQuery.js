const getSearchQuery = (req) => {
  const result = {};
  Object.keys(req.query).forEach((key) => {
    result[key] = req.query[key];
  });

  result.userId = req.user.userId;

  return result;
};

const transformToMongoQuery = (query) => {
  const searchQuery = {};
  if (query) {
    if (query.userId) {
      searchQuery.user = query.userId;
    }
    if (query.date) {
      searchQuery.createdAt = {
        $gte: query.date,
        $lt: new Date(query.date.getTime() + (24 * 60 * 60 * 1000)),
      };
    } else {
      if (query.begin) {
        searchQuery.createdAt = {
          $gte: query.begin,
        };
      }

      if (query.end) {
        searchQuery.createdAt = {
          $lt: query.end,
        };
      }
    }

    if (query.is_processed || query.is_canceled
       || query.is_completed || query.is_failed || query.is_received || query.sent_back) {
      searchQuery.$or = [];
      if (query.is_processed) {
        searchQuery.$or.push({ status: 'IS_PROCESSED' });
      }
      if (query.is_canceled) {
        searchQuery.$or.push({ status: 'IS_CANCELED' });
      }
      if (query.is_completed) {
        searchQuery.$or.push({ status: 'IS_COMPLETED' });
      }
      if (query.is_failed) {
        searchQuery.$or.push({ status: 'IS_FAILED' });
      }
      if (query.is_received) {
        searchQuery.$or.push({ status: 'IS_RECEIVED' });
      }
      if (query.sent_back) {
        searchQuery.$or.push({ status: 'SENT_BACK' });
      }
    }
  }

  return searchQuery;
};

module.exports = { getSearchQuery, transformToMongoQuery };
