<template>
  <BaseView class="container">
    <template v-slot:main-content>
      <div class="info">
        <h3 class="mb-5 title">Help with TRAINSET</h3>
        <h5 class="text-uppercase text-left subh">Input data format</h5>
        <p class='text-left'>TRAINSET only accepts specific file formats. This <a href="/static/sample_trainset.csv" download>sample CSV</a> is formatted correctly. Files uploaded to TRAINSET must have four comma-delimited columms with the header: <code>filename, timestamp, value, label</code>; <code>null</code> data are not allowed.</p>

        <div class='text-left'>
          <ul style="list-style-type:square;">
          <li><code>filename</code> is a unique name of the time series you are labeling. The contents of every row of <code>filename</code> must be identical.</li>
          <li><code>timestamp</code> is a timestamp with time zone in <a href="https://en.wikipedia.org/wiki/ISO_8601" target="_blank">ISO8601 format</a>. For example <code>2019-03-13T21:11:29+00:00</code> or <code>2019-03-13T21:11:29Z</code>.</li>
          <li><code>value</code> is a numeric scalar. Any real number is a valid for <code>value</code>.</li>
          <li><code>label</code> is an integer representation of a boolean; <code>0==FALSE</code> and <code>1==TRUE</code>. It is possible to upload data to TRAINSET that is pre-labeled (i.e. the <code>label</code> column does not have to start with all zeros). See the <a href="/static/sample_trainset.csv" download>sample CSV</a>.</li>
          </ul>
        </div>
        <p class="mb-5"><strong>Failure to properly format your data will result in failed uploads.</strong></p>

        <h5 class="text-uppercase text-left subh">Labeling and Navigating</h5>
        <p class='text-left mb-5'>Labeling is the act of applying labels, whether true or false, to your time series data. Labels can be toggled by clicking on points, or many labels can be applied at once by  "brushing" (clicking and dragging) over many points. Navigation of the time series is accomplished either with shortcut keys or by highlighting a "focus region" on the "context bar" underneath the plot. The focus region can be brushed onto the context bar, dragged, and resized with the mouse or with shortcut keys. A legend of available shortcut keys is shown below the plot to help you navigate the time series and apply labels.</p>

        <h5 class="text-left text-uppercase subh">Exporting</h5>
        <p class='text-left mb-5'>After you finish labeling, you can export your data. An export will download a CSV to your default downloads folder. The name of this CSV will have the suffix <code>-labeled</code>. If the file you uploaded already had the suffix <code>-labeled</code>, no additional suffix will be added.</p>

        <h5 class="text-left text-uppercase subh">Privacy</h5>
        <p class='text-left mb-5'>TRAINSET is a client-side application. Although we use the word "upload" to describe importing data into TRAINSET, your time series data and labels are never transferred over the internet or visible to Geocene. Feel free to deploy TRAINSET locally using the instructions in the <a href="https://github.com/geocene/trainset" target="_blank">GitHub ReadMe</a>.</p>
      </div>
    </template>
  </BaseView>
</template>
