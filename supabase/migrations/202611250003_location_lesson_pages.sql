update storage.buckets
set allowed_mime_types = array_append(allowed_mime_types, 'application/vnd.apple.pages')
where id = 'location-lesson-files'
  and allowed_mime_types is not null
  and not ('application/vnd.apple.pages' = any(allowed_mime_types));
