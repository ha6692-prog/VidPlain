const fs = require('fs');
let c = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
c = c.slice(0, c.lastIndexOf('{/* Activity Feed */}'));
c += '{/* Activity Feed */}\n' +
'                    <div className="border border-border p-6 bg-background">\n' +
'                        <h3 className="font-mono uppercase mb-4 text-accent">Recent Activity</h3>\n' +
'                        <div className="space-y-4">\n' +
'                              {recentSessions && recentSessions.length > 0 ? recentSessions.map((act, i) => (\n' +
'                                  <div key={i} className="flex gap-4 border-b border-border/50 pb-4 last:border-0 last:pb-0">\n' +
'                                      <div className="w-2 h-2 mt-2 bg-accent shrink-0" />\n' +
'                                      <div>\n' +
'                                          <h4 className="font-mono text-sm uppercase">{act.subject}</h4>\n' +
'                                          <p className="text-xs font-mono text-secondary-foreground mt-1">{act.duration} ? {act.status} ? {act.date}</p>\n' +
'                                      </div>\n' +
'                                  </div>\n' +
'                              )) : (\n' +
'                                  <div className="text-sm font-mono text-secondary-foreground">Loading recent activity...</div>\n' +
'                              )}\n' +
'                        </div>\n' +
'                    </div>\n' +
'                </div>\n' +
'            </div>\n' +
'            </div>\n' +
'            </div>\n' +
'            </div>\n' +
'            </div>\n' +
'            </div>\n' +
'        </div>\n' +
'    )\n' +
'}\n';
fs.writeFileSync('app/dashboard/page.tsx', c);
